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

    // your app here
    var s1 = new ImageSurface({
        size: [250, 250],
        content: '<iframe class="pane" width="100%" height="450" scrolling="no" frameborder="no" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/149019383&amp;auto_play=false&amp;hide_related=false&amp;visual=true"></iframe>',
        classes: ['backfaceVisibility']
    });
    var s2 = new ImageSurface({
        size: [250, 250],
        content: '<iframe class="pane" width="100%" height="250" scrolling="no" frameborder="no" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/150030882&amp;auto_play=false&amp;hide_related=false&amp;visual=true"></iframe>',
        classes: ['backfaceVisibility']
    });
    var s3 = new ImageSurface({
        size: [250, 250],
        content: '<iframe class="pane" width="100%" height="450" scrolling="no" frameborder="no" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/149137994&amp;auto_play=false&amp;hide_related=false&amp;visual=true"></iframe>',
        classes: ['backfaceVisibility']
    });

    var initialTime = Date.now();
    var centerSpinModifier = new Modifier({
        origin: [0.5, 0.5],
        transform : function() {
            return Transform.rotateY(0.002 * (Date.now() - initialTime));
        }
    });

    var centerPositionModifier = new Modifier({
        origin: [0.5, 0.5]
    });

    var three = new Modifier({
        transform:  [1,    0.25, 0, 0,
                     0, 1,   0, 0,
                     0,    0,   1, 0,
                     0,    0,   0, 1]
    });
    var initial = Date.now();
    var offset = new Modifier({
        origin: [0.5, 0.5],
        transform: function () {
          return Transform.translate(-30, -40, 10);
        }
    });
    var offset2 = new Modifier({
        origin: [0.5, 0.5],
        transform: function () {
          return Transform.translate(-60, 0, 10);
        }
    });

    // .add(centerSpinModifier)
    var tree = mainContext.add(centerPositionModifier).add(three);
    tree.add(s1);
    tree.add(offset).add(s2);
    tree.add(offset2).add(s3);
});
