# Shape Connection UI

An interactive tool for creating, connecting, and manipulating shapes using vanilla HTML, CSS, and JavaScript.

## Features

- Create different shapes (circles, rectangles, triangles)
- Connect shapes with lines
- Move shapes around while maintaining connections
- Delete shapes and connections
- Save and load diagrams

## Modes

- **Move Mode**: Drag shapes to reposition them
- **Connection Mode**: Create lines between shapes
- **Delete Mode**: Remove shapes and their connections

## How to Use

1. Open `index.html` in a web browser
2. Select a shape type and click "Add Shape" to add to the canvas
3. Use the mode button to switch between different interaction modes
4. Choose colors for shapes and connections
5. Save your diagram using the "Save Diagram" button
6. Load existing diagrams using the "Load Diagram" button

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## License

MIT

## Project Structure

shape-connection-app/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── shapeCanvas.js
│   ├── utils/
│   │   ├── shapeUtils.js
│   │   ├── connectionUtils.js
│   │   └── fileUtils.js
│   └── ui/
│       ├── toolbarControls.js
│       ├── modeControls.js
│       └── saveLoadControls.js
└── README.md