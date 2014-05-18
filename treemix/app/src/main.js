/* globals define */
define(function(require, exports, module) {
  'use strict';
  // import dependencies
  var Engine = require('famous/core/Engine');
  var Modifier = require('famous/core/Modifier');
  var Transform = require('famous/core/Transform');
  var ImageSurface = require('famous/core/Surface');
  var Matrix = require('famous/math/Matrix');
  var Transitionable   = require("famous/transitions/Transitionable");
  var SpringTransition = require("famous/transitions/SpringTransition");
  var TransitionableTransform = require("famous/transitions/TransitionableTransform");
  var SnapTransition = require("famous/transitions/SnapTransition");
  var Easing           = require("famous/transitions/Easing");

  // create the main context
  var mainContext = Engine.createContext();
  var size = window.innerHeight / 1.5;

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
  var numElements = 30;
  var elYOffset = 80;
  var elXOffset = -85;
  var elements = [];

  function getOffsets(index) {
    index = index - Math.floor(numElements/2);

    return {
      x: elXOffset * index,
      y: elYOffset * index,
      z: index
    };
  }

  function addPane(tree, index) {
    var el = {
      i: index,
      pane: new ImageSurface({
          size: [size, size],
          content: '<div class="pane"></div>'
      }),
      offsets: getOffsets(index),
      modifier: null,
      transform: new TransitionableTransform()
    };

    el.transform.set(Transform.translate(el.offsets.x, el.offsets.y, el.offsets.z));

    el.modifier = new Modifier({
      transform: el.transform
    });

    elements.push(el);
    tree.add(el.modifier).add(el.pane);
  }

  Transitionable.registerMethod('spring', SpringTransition);
  Transitionable.registerMethod('snap', SnapTransition);
  /*var transition = {
      method: "snap",
      period: 200,
      dampingRatio: 0.9,
      velocity: 0,
      duration: 200
  };*/
  /*var transition = {
      method: "spring",
      period: 200,
      dampingRatio: 0.7,
      velocity: 0,
      duration: 200
  };*/
  var transition = {
    duration: 500,
    curve: Easing.outQuad
  };

  function scrollTo(index) {
    isPulledOut = false;
    var center = Math.floor(numElements/2);

    while (index < center) {
      elements.push(elements.shift());
      index += 1;
    }

    while (index > center) {
      elements.unshift(elements.pop());
      index -= 1;
    }

    _.each(elements, function (el, index) {
      var newOffsets = getOffsets(index);

      // if moving to back of the line, don't animate
      if (Math.abs(newOffsets.y - el.offsets.y) >
          elYOffset * Math.floor(numElements/2)) {
        el.offsets = newOffsets;
        el.transform.set(
            Transform.translate(el.offsets.x, el.offsets.y, el.offsets.z),
            {duration: 0});
        return;
      }

      el.offsets = newOffsets;
      el.transform.set(
        Transform.translate(el.offsets.x, el.offsets.y, el.offsets.z),
        transition);
    });
  }

  var lastScrollId = null;
  function scrollNext(gesture) {
    //console.log('scroll next')
    if (lastScrollId === gesture.id) {
      return;
    }
    lastScrollId = gesture.id;
    //console.log(frame);
    var forward = gesture.direction[2] >= 0;
    scrollTo(Math.floor(numElements/2) + (forward ? 1 : -1));
  }

  //var lastPullOutId = null
  var isPulledOut = false;
  function pullOut(gesture) {
    /*if (lastPullOutId === gesture.id) {
      return;
    }
    lastPullOutId = gesture.id;*/

    if (isPulledOut) {
      return scrollTo(Math.floor(numElements/2));
    }

    isPulledOut = true;
    var el = elements[Math.floor(numElements/2)];
    el.transform.set(
            Transform.translate(size, el.offsets.y, el.offsets.z),
            transition);
  }

  window.scrollTo = scrollTo;
  window.pullOut = pullOut;

  for (var i = 0; i < numElements; i++) {
    addPane(tree, i);
  }

  function distance(v1, v2) {
    var sum = _.reduce(_.zip(v1, v2), function (sum, xs) {
      return Math.pow(xs[0] - xs[1], 2);
    }, 0);
    return Math.sqrt(sum);
  }

  var nameMap = ['thumb', 'index', 'middle', 'ring', 'pinky'];
  function isPinch(fingers) {

    var thumb = _.find(fingers, function (finger) {
      return nameMap[finger.type] === 'thumb';
    });
    var index = _.find(fingers, function (finger) {
      return nameMap[finger.type] === 'index';
    });

    if (!index || !index.tipPosition || !thumb || !thumb.tipPosition) {
      return false;
    }

    return distance(index.tipPosition, thumb.tipPosition) < 3;
  }

  var playing = false;
  function play() {
    if (playing) {
      console.log('pause');
      playing = false;
    } else {
      console.log('play');
      playing = true;
    }
  }

  var controllerOptions = {enableGestures: true};
  var scrollNextThrottled = _.throttle(scrollNext, 1400);
  var pullOutThrottled = _.throttle(pullOut, 1400);
  var playThrottled = _.throttle(play, 2000);
  var pinching = false;

  window.onkeydown = function (key) {
    var k = key.keyCode;

    // up, right
    if (k===38 || k === 39) {
      scrollNext({
        id: Math.random(),
        direction: [0, 0, 1]
      });
    }
    // left, down
    if (k===40 || k === 37) {
      scrollNext({
        id: Math.random(),
        direction: [0, 0, -1]
      });
    }
    // space
    if (k===32) {
      pullOut();
    }
    // P
    if (k===80) {
      play();
    }
  };
  // 172.31.34.208:3000

  Leap.loop(controllerOptions, function(frame) {
    // Body of callback function
    // Display Gesture object data
    if (frame.gestures.length > 0) {
      for(var i=0, l=frame.gestures.length;i<l;i++) {
        var gesture = frame.gestures[i];
        if (gesture.type === 'swipe') {
          scrollNextThrottled(gesture);
        } else if (gesture.type === 'screenTap') {
          playThrottled();
        }
        /*else if (gesture.type === 'keyTap') {
          pullOutThrottled(gesture);
        }*/
      }
    }

    if (!pinching && isPinch(frame.fingers)) {
      pinching = true;
      pullOutThrottled();
    } else if (!isPinch(frame.fingers)) {
      pinching = false;
    }
  });
});
