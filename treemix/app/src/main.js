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

  function pullOut() {
    var el = elements[Math.floor(numElements/2)];
    el.transform.set(
            Transform.translate(size, el.offsets.y, el.offsets.z),
            transition);
  }

  function addPane(tree, index) {
    var el = {
      i: index,
      pane: new ImageSurface({
          size: [size, size],
          content: '<div class="pane">' + index + '</div>'
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

  var pulledOut = null;

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

  function scrollNext() {
    console.log(1);
    scrollTo(Math.floor(numElements/2) + 1);
  }

  window.scrollTo = scrollTo;
  window.pullOut = pullOut;

  for (var i = 0; i < numElements; i++) {
    addPane(tree, i);
  }

  var controllerOptions = {enableGestures: true};
  var scrollNextThrottled = _.throttle(scrollNext, 1600);
  Leap.loop(controllerOptions, function(frame) {
    // Body of callback function
    // Display Gesture object data
    if (frame.gestures.length > 0) {
      for(var i=0, l=frame.gestures.length;i<l;i++) {
        if (frame.gestures[i].type === 'swipe') {
          scrollNextThrottled();
        }
      }
    }
  });
});
