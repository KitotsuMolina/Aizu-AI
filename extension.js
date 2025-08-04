/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */
'use strict';

/**
 * Aizu AI - Chatbot para GNOME con Ollama
 * Adaptado de la estructura y conceptos de Penguin AI.
 * Enfocado únicamente en la simplicidad y la conexión local.
 */

// 1. IMPORTACIONES MODERNAS (ESM)
// Añade Clutter a esta línea
import GObject from 'gi://GObject';
import St from 'gi://St';
import Soup from 'gi://Soup';
import Clutter from 'gi://Clutter'; // <-- AÑADE ESTA LÍNEA
import GLib from 'gi://GLib';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

// --- La Clase para el Botón y Menú del Panel ---
const AizuAiIndicator = GObject.registerClass(
    class AizuAiIndicator extends PanelMenu.Button {

        // Reemplaza tu método _init
        _init() {
            super._init(0.5, 'Aizu AI', false);

            // Propiedades de la clase
            this._history = [];
            // Creamos la sesión de red y le asignamos un timeout más largo.
            // El valor está en segundos. 600 segundos = 10 minutos.
            this._ollamaSession = new Soup.Session({ timeout: 600 });
            this._speechPid = null; // Para el ID del proceso de audio
            this._activeStopButton = null; // Para el botón de stop del mensaje actual

            // Construir toda la interfaz de usuario
            this._initializeUI();
        }

        // Método para crear y organizar todos los elementos de la UI
        // Reemplaza tu método _initializeUI por esta versión sin el botón de stop
        _initializeUI() {
            this.add_child(new St.Icon({
                icon_name: 'Aizu AI',
                style_class: 'icon-aizu',
            }));

            const menuLayout = new St.BoxLayout({ vertical: true });

            this._chatHistory = new St.BoxLayout({ vertical: true });
            const scrollView = new St.ScrollView({ style_class: 'aizuai-scroll-view' });
            scrollView.set_child(this._chatHistory);
            menuLayout.add_child(scrollView);

            const bottomBox = new St.BoxLayout({ vertical: false, style_class: 'aizuai-bottom-box' });

            this._entry = new St.Entry({
                hint_text: 'Pregúntale a Aizu...',
                can_focus: true,
                style_class: 'aizuai-entry',
                x_expand: true,
            });

            const newConversationButton = new St.Button({
                style_class: 'aizuai-icon-button',
                child: new St.Icon({ icon_name: 'tab-new-symbolic' }),
            });

            // Hemos quitado el botón de stop de aquí
            bottomBox.add_child(this._entry);
            bottomBox.add_child(newConversationButton);
            menuLayout.add_child(bottomBox);

            const popupMenuSection = new PopupMenu.PopupMenuSection();
            popupMenuSection.actor.add_child(menuLayout);
            this.menu.addMenuItem(popupMenuSection);

            // Conectar señales
            this._entry.clutter_text.connect('activate', () => this._handleUserInput());
            newConversationButton.connect('clicked', () => this._handleNewConversation());
            this.menu.connect('open-state-changed', (menu, isOpen) => {
                if (isOpen) this._entry.grab_key_focus();
            });
        }

        // Añade este método nuevo a tu clase
        // Reemplaza tu método _stopSpeech completo por esta versión final y correcta
        _stopSpeech() {
            if (this._speechPid) {
                // --- LA CORRECCIÓN ESTÁ AQUÍ ---
                // Usamos 'pkill -P' para matar el proceso padre Y TODOS sus hijos (piper, sox, aplay).
                const command = ['pkill', '-P', this._speechPid.toString()];

                try {
                    // Ejecutamos el comando para detener todo el árbol de procesos de audio.
                    GLib.spawn_async(null, command, null, GLib.SpawnFlags.SEARCH_PATH, null);
                } catch (e) {
                    logError(e, "Error al intentar detener el audio con pkill.");
                }
                this._speechPid = null;
            }

            // Oculta el botón de stop activo si existe.
            if (this._activeStopButton) {
                this._activeStopButton.hide();
            }
        }

        // Maneja el envío de un nuevo mensaje
        // Reemplaza tu método _handleUserInput completo por este
        _handleUserInput() {
            const prompt = this._entry.get_text();
            if (prompt.trim() === '' || !this._entry.reactive) return;

            this._history.push({ role: 'user', content: prompt });
            this._addMessage('<b>Tú:</b>', prompt);
            this._entry.set_text('');

            // La línea corregida para evitar el error de "Unhandled promise rejection"
            this._askOllama().catch(logError);
        }

        // Inicia una nueva conversación
        // Reemplaza tu método _handleNewConversation por este
        _handleNewConversation() {
            if (!this._entry.reactive) return;

            this._stopSpeech(); // <--- AÑADE ESTA LÍNEA
            this._history = [];
            this._chatHistory.destroy_all_children();
        }
        // Reemplaza tu método _addMessage completo por este
        _addMessage(actor, message) {
            const isUser = actor.includes('Tú');

            const label = new St.Label({
                text: message.trim(),
                style_class: isUser ? 'aizuai-usermessage' : 'aizuai-aimessage',
            });
            label.clutter_text.use_markup = !isUser; // Usamos markup solo para la IA (Tú vs <b>Aizu:</b>)
            label.clutter_text.set_line_wrap(true);

            const messageBox = new St.BoxLayout({ style_class: 'aizuai-message-box' });
            messageBox.set_x_align(isUser ? Clutter.ActorAlign.END : Clutter.ActorAlign.START);

            // Añadimos la burbuja de texto a su caja contenedora
            messageBox.add_child(label);

            // --- LÓGICA NUEVA: AÑADIR BOTÓN DE STOP A LA IA ---
            if (!isUser) {
                const stopButton = new St.Button({
                    style_class: 'aizuai-icon-button-stop',
                    style: 'margin-left: 8px;', // Pequeño espacio entre la burbuja y el botón
                    child: new St.Icon({ icon_name: 'media-playback-stop-symbolic' }),
                });
                stopButton.connect('clicked', () => this._stopSpeech());
                stopButton.hide(); // Oculto por defecto

                // Guardamos una referencia a este botón para poder mostrarlo/ocultarlo después
                this._activeStopButton = stopButton;
                messageBox.add_child(stopButton);
            }

            this._chatHistory.add_child(messageBox);
        }
        // Reemplaza tu método _speak por esta versión mejorada
        // Versión de DEPURACIÓN de _speak para capturar todos los errores
        // Reemplaza tu método _speak por esta versión con rutas absolutas
        _speak(textToSpeak) {
            this._stopSpeech();

            // --- CONFIGURACIÓN DE RUTAS ---
            // ¡Asegúrate de que estas rutas son las correctas según el comando 'which'!
            const piperPath = '/home/kitotsu/.local/bin/piper';
            const aplayPath = '/usr/bin/aplay';
            const modelPath = '/home/kitotsu/piper-voices/es_MX-claude-high.onnx';

            const sanitizedText = textToSpeak.replace(/"/g, '\\"').replace(/`/g, '\\`').replace(/\$/g, '\\$');

            // Comando simplificado (sin sox) y con rutas absolutas
            const command = [
                'bash',
                '-c',
                `echo "${sanitizedText}" | ${piperPath} --model ${modelPath} --output_file - | ${aplayPath} -q`
            ];

            try {
                let [ok, pid] = GLib.spawn_async(null, command, null,
                    GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.DO_NOT_REAP_CHILD,
                    null
                );
                if (ok) {
                    this._speechPid = pid;
                    if (this._activeStopButton) {
                        this._activeStopButton.show();
                    }
                    GLib.child_watch_add(GLib.PRIORITY_DEFAULT, pid, (pid, status) => {
                        if (pid === this._speechPid) {
                            this._speechPid = null;
                            if (this._activeStopButton) {
                                this._activeStopButton.hide();
                            }
                        }
                    });
                }
            } catch (e) {
                logError(e, '[Aizu AI] Error al ejecutar el comando de voz de Piper');
            }
        }

        // Reemplaza tu función _askOllama por esta versión con más logs
        // Reemplaza tu método _askOllama por esta versión corregida
        // Reemplaza tu método _askOllama por esta versión más robusta
        // Reemplaza tu método _askOllama por esta versión
        async _askOllama() {
            this._entry.set_reactive(false);
            this._entry.set_hint_text('Pensando...');

            // NOTA: Para probar, cambia "llama3.1" por "deepseek-r1" aquí
            const modelToUse = "llama3.1";

            const requestBodyString = JSON.stringify({
                model: modelToUse,
                messages: this._history,
                stream: false,
            });

            const requestBodyBytes = new TextEncoder().encode(requestBodyString);
            const message = Soup.Message.new('POST', 'http://localhost:11434/api/chat');
            message.set_request_body_from_bytes('application/json', requestBodyBytes);

            try {
                const bytes = await this._ollamaSession.send_and_read_async(message, null, null);
                const responseStr = new TextDecoder().decode(bytes.get_data());
                const responseJson = JSON.parse(responseStr);

                log(`[Aizu AI] Respuesta JSON completa de Ollama: ${responseStr}`);

                if (responseJson.error) {
                    logError(`[Aizu AI] Ollama devolvió un error: ${responseJson.error}`);
                    this._addMessage('<b>Error:</b>', responseJson.error);
                    return;
                }

                if (responseJson.message && responseJson.message.content) {
                    let responseContent = responseJson.message.content;

                    // --- LA NUEVA LÓGICA ESTÁ AQUÍ ---
                    // Verificamos si el modelo es uno de la familia 'deepseek'.
                    if (responseJson.model.includes('deepseek')) {
                        // Usamos una expresión regular para encontrar y eliminar el bloque <think>...</think>
                        // y cualquier espacio en blanco o salto de línea alrededor.
                        const thinkBlockRegex = /<think>[\s\S]*?<\/think>\s*/;
                        responseContent = responseContent.replace(thinkBlockRegex, '');
                    }
                    // --- FIN DE LA NUEVA LÓGICA ---

                    this._history.push({ role: 'assistant', content: responseContent });
                    this._addMessage('<b>Aizu:</b>', responseContent);
                    this._speak(responseContent);
                } else {
                    logError('[Aizu AI] La estructura del JSON de Ollama no es la esperada.');
                    this._addMessage('<b>Error:</b>', 'Respuesta inesperada del servidor.');
                }

            } catch (error) {
                logError(error, '[Aizu AI] Ha ocurrido un error en el bloque TRY');
                this._addMessage('<b>Error:</b>', 'No se pudo conectar con Ollama.');
            } finally {
                this._entry.set_reactive(true);
                this._entry.set_hint_text('Pregúntale a Aizu...');
                this._entry.grab_key_focus();
            }
        }

        // Método para limpiar recursos cuando la extensión se desactiva
        destroy() {
            // Aquí se podrían desconectar señales si fuera necesario
            super.destroy();
        }
    });

// --- La Clase Principal de la Extensión (Punto de Entrada) ---
export default class AizuAiExtension extends Extension {
    enable() {
        this._indicator = new AizuAiIndicator();
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        this._indicator.destroy();
        this._indicator = null;
    }
}