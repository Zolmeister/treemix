/* globals define */
define(function(require, exports, module) {
  'use strict';
  // import dependencies
  var Engine = require('famous/core/Engine');
  var Modifier = require('famous/core/Modifier');
  var Transform = require('famous/core/Transform');
  var ImageSurface = require('famous/core/Surface');
  var Matrix = require('famous/math/Matrix');

  // create the main context
  var mainContext = Engine.createContext();
  var size = window.innerHeight / 1.3;

  var three = new Modifier({
    transform: [1, 0.3, 0, 0,
        0, 1, 0, 0,
        0, 0.1, 1, 0,
        0, 0, 0, 1
    ]
  });
  var centerPositionModifier = new Modifier({
    origin: [0.3, 0]
  });

  var tree = mainContext.add(centerPositionModifier).add(three);

  function addPane(tree, index) {
    var pane = new ImageSurface({
        size: [size, size],
        content: '<div class="pane">' + i + '</div>'
    });

    var offsetX = !index ? size : -55 * index;
    var offsetY = 50 * index;
    var offset = new Modifier({
      transform: function() {
        return Transform.translate(offsetX, offsetY, 0);
      }
    });

    tree.add(offset).add(pane);
  }

  for (var i = -15; i < 15; i++) {
    addPane(tree, i);
  }

});
