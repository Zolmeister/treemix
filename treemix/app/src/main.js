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
  var size = window.innerHeight / 1.3
  console.log(size);
  // your app here
  var s1 = new ImageSurface({
    size: [size, size],
    content: '<iframe class="pane" width="100%" height="100%" scrolling="no" frameborder="no" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/149019383&amp;auto_play=false&amp;hide_related=false&amp;visual=true"></iframe>',
    classes: ['backfaceVisibility']
  });
  var s2 = new ImageSurface({
    size: [size, size],
    content: '<iframe class="pane" width="100%" height="100%" scrolling="no" frameborder="no" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/150030882&amp;auto_play=false&amp;hide_related=false&amp;visual=true"></iframe>',
    classes: ['backfaceVisibility']
  });
  var s3 = new ImageSurface({
    size: [size, size],
    content: '<iframe class="pane" width="100%" height="100%" scrolling="no" frameborder="no" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/149137994&amp;auto_play=false&amp;hide_related=false&amp;visual=true"></iframe>',
    classes: ['backfaceVisibility']
  });

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
      content: '<div class="pane">' + i + '</div>',
      classes: ['backfaceVisibility']
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
  /*
    tree.add(s1);
    tree.add(offset).add(s2);
    tree.add(offset2).add(s3);*/

  var initialTime = Date.now();
  var centerSpinModifier = new Modifier({
    origin: [0.5, 0.5],
    transform: function() {
      return Transform.rotateY(0.002 * (Date.now() - initialTime));
    }
  });



  var initial = Date.now();
  var offset = new Modifier({
    transform: function() {
      return Transform.translate(500, 60, 0);
    }
  });
  var offset2 = new Modifier({
    transform: function() {
      return Transform.translate(-120, 120, 0);
      //return Transform.translate(-450, 450, 0);
    }
  });

  // .add(centerSpinModifier)

});