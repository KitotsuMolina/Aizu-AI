# Aizu AI 🧠

Un asistente de chatbot para GNOME, diseñado para una integración simple y rápida con tu instancia local de Ollama.

![Captura de pantalla de Aizu AI](ruta/a/tu/captura_de_pantalla.png)
*(Recomendación: Haz una captura de pantalla de tu extensión funcionando y reemplaza la línea de arriba)*

## Acerca del Proyecto

Aizu AI nace de la idea de tener un asistente de inteligencia artificial directamente en el escritorio de GNOME, priorizando la privacidad y el rendimiento al conectarse exclusivamente a una instancia local de **Ollama**. La extensión se integra en la barra superior de GNOME, ofreciendo una interfaz de chat limpia y accesible para interactuar con tus modelos de lenguaje favoritos de forma nativa.

Actualmente, la extensión está configurada para conectarse exclusivamente al modelo **`llama3.1`** a través de Ollama, con el objetivo de ofrecer una experiencia sencilla y lista para usar.

## Características Principales

* **Integración Nativa con GNOME Shell**: Un icono en la barra superior te da acceso instantáneo al chat.
* **Conexión 100% Local y Privada**: Todas las peticiones se hacen a tu propia instancia de Ollama, nada se envía a la nube.
* **Interfaz de Chat Sencilla**: Un diseño limpio con burbujas de chat para el usuario y la IA, alineadas para una fácil lectura.
* **Respuesta por Voz (TTS)**: Las respuestas del asistente son leídas en voz alta usando [Piper](https://github.com/rhasspy/piper), permitiendo una interacción más natural.
* **Control de Audio**: Un botón de "Stop" aparece junto a la respuesta de la IA, permitiéndote detener la reproducción de audio en cualquier momento.
* **Gestión de Conversación**: Inicia una nueva conversación con un solo clic, limpiando el historial actual.

## Instalación

Para instalar y ejecutar Aizu AI, necesitas tener los siguientes prerrequisitos instalados y configurados.

### Prerrequisitos

1.  **Ollama**: Debes tener Ollama instalado y el servicio en ejecución.
    * La extensión usa el modelo `llama3.1` por defecto. Asegúrate de tenerlo descargado:
        ```bash
        ollama pull llama3.1
        ```

2.  **Piper TTS**: Necesitas tener [Piper](https://github.com/rhasspy/piper) instalado para la funcionalidad de texto a voz.
    * Esta extensión está configurada para usar una voz específica de alta calidad. Descarga los siguientes dos archivos desde Hugging Face:
        * **Modelo de Voz**: [es_MX-claude-high.onnx](https://huggingface.co/csukuangfj/vits-piper-es_MX-claude-high/blob/main/es_MX-claude-high.onnx)
        * **Archivo de Configuración**: [es_MX-claude-high.onnx.json](https://huggingface.co/csukuangfj/vits-piper-es_MX-claude-high/blob/main/es_MX-claude-high.onnx.json)
    * Guarda ambos archivos en la siguiente ruta exacta: `/home/kitotsu/piper-voices/`. Si la carpeta no existe, créala. El archivo `extension.js` ya está configurado para buscar la voz en esta ubicación.(Ire modificando para que funcione con tu ruta de Home, apra ahora que estoy probando lo dejo asi mientras tanto)

3.  **GNOME Shell**: Esta extensión ha sido desarrollada y probada en la versión 46.

### Pasos de Instalación

1.  **Clona el repositorio** en tu máquina local:
    ```bash
    git clone [https://github.com/KitotsuMolina/Aizu-AI.git](https://github.com/KitotsuMolina/Aizu-AI.git)
    ```
2.  **Copia los archivos** a tu directorio de extensiones de GNOME. Asegúrate de que el nombre de la carpeta coincida con el UUID del `metadata.json` (`aizuai@kitotsu`).
    ```bash
    # Suponiendo que el UUID es aizuai@kitotsu y que estás dentro de la carpeta del proyecto
    cp -r . ~/.local/share/gnome-shell/extensions/aizuai@kitotsu/
    ```
3.  **Reinicia GNOME Shell**:
    * Si usas **X11**, presiona `Alt` + `F2`, escribe `r` y pulsa `Enter`.
    * Si usas **Wayland**, necesitas cerrar sesión y volver a iniciarla.

4.  **Activa la extensión**:
    * Abre la aplicación "Extensiones" de GNOME.
    * Busca "Aizu AI" en la lista y activa el interruptor.

## Uso

1.  Haz clic en el icono de Aizu AI en la barra superior para abrir el menú del chat.
2.  Escribe tu pregunta en el campo de texto y presiona `Enter`.
3.  La respuesta aparecerá en la ventana y se leerá en voz alta.
4.  Usa el botón de "stop" (⏹️) que aparece junto a la respuesta para detener el audio si es muy largo.
5.  Usa el botón de "nueva conversación" (📋) para limpiar el historial y empezar de cero.

## Mejoras Futuras (Roadmap)

Aizu AI es un proyecto en desarrollo. La funcionalidad actual es estable, pero hay muchas mejoras planeadas para el futuro:

* [ ] **Selección de Modelo**: Añadir una pantalla de configuración para permitir al usuario **elegir cualquier modelo** disponible en su instancia de Ollama, en lugar de usar únicamente `llama3.1`.
* [ ] **Soporte para Streaming**: Modificar la conexión con Ollama para que las respuestas aparezcan palabra por palabra, mejorando la sensación de velocidad.
* [ ] **Reconocimiento de Voz (STT)**: Integrar los scripts de `whisper.cpp` para permitir una interacción completamente por voz.
* [ ] **Persistencia de Historial**: Guardar las conversaciones para que no se pierdan al reiniciar GNOME Shell.

## Licencia

Este proyecto está distribuido bajo la Licencia Pública General de GNU v2.0. Ver el archivo `LICENSE` para más información.
