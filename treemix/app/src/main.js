/* globals define */
define(function(require, exports, module) {
  'use strict';
  // import dependencies
  var Engine = require('famous/core/Engine');
  var Modifier = require('famous/core/Modifier');
  var Transform = require('famous/core/Transform');
  var ImageSurface = require('famous/core/Surface');
  var Matrix = require('famous/math/Matrix');
  var Transitionable = require("famous/transitions/Transitionable");
  var SpringTransition = require("famous/transitions/SpringTransition");
  var TransitionableTransform = require("famous/transitions/TransitionableTransform");
  var SnapTransition = require("famous/transitions/SnapTransition");
  var Easing = require("famous/transitions/Easing");

  // create the main context
  var mainContext = Engine.createContext();
  var size = Math.floor(window.innerHeight / 2.75);

  var three = new Modifier({
    transform: [1, 0.35, 0, 0,
      0, 1, 0, 0,
      0, 0.1, 1, 0,
      0, 0, 0, 1
    ]
  });
  var centerPositionModifier = new Modifier({
    origin: [0.5, 0.2]
  });

  var pauseSize = Math.floor(size / 5);
  var pause = new ImageSurface({
    size: [pauseSize, pauseSize],
    content: '<div class="pause"><i class="fa fa-play"></i></div><h5 class="tracktitle" id="trackName">Nothing Playing</h5>'
  });
  var bottomRight = new Modifier({
    origin: [0.98, 0.90]

  });
  var pause3 = new Modifier({
    transform: [1, 0.1, 0, 0,
      0, 1, 0, 0,
      0, 0.1, 1, 0,
      0, 0, 0, 1
    ]
  });
  mainContext.add(bottomRight).add(pause);

  setTimeout(function() {
    $('.pause').show();
    $('.pause').css({
      fontSize: pauseSize
    });
  }, 100);
  var tree = mainContext.add(centerPositionModifier).add(three);
  var numElements = 50;
  var elYOffset = 60;
  var elXOffset = -65;
  var elements = [];

  function getOffsets(index) {
    index = index - Math.floor(numElements / 2);

    return {
      x: elXOffset * index,
      y: elYOffset * index,
      z: index
    };
  }

  function addPane(tree, index, obj) {
    var el = {
      i: index,
      pane: new ImageSurface({
        size: [size, size],
        content: '<div class="pane" data-index="' + index + '" data-name="' + obj.name + '" id="' + obj.soundcloudId + '"><div class="pane-title-wrapper"><h3 class="pane-title">' + obj.name + '</h3></div><img src=' + obj.artwork_url + '/></div>'
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
  var transition = {
    method: "spring",
    period: 700,
    dampingRatio: 0.9,
    velocity: 0,
    duration: 100
  };
  // var transition = {
  //   duration: 500,
  //   period: 400,
  // //   dampingRatio: 0.8,
  //   curve: Easing.outQuad
  // };

  function scrollTo(index) {
    isPulledOut = false;
    var center = Math.floor(numElements / 2);

    while (index < center) {
      elements.push(elements.shift());
      index += 1;
    }

    while (index > center) {
      elements.unshift(elements.pop());
      index -= 1;
    }

    _.each(elements, function(el, index) {
      var newOffsets = getOffsets(index);

      // if moving to back of the line, don't animate
      if (Math.abs(newOffsets.y - el.offsets.y) >
        elYOffset * Math.floor(numElements / 2)) {
        el.offsets = newOffsets;
        el.transform.set(
          Transform.translate(el.offsets.x, el.offsets.y, el.offsets.z), {
            duration: 0
          });
        return;
      }

      el.offsets = newOffsets;
      el.transform.set(
        Transform.translate(el.offsets.x, el.offsets.y, el.offsets.z),
        transition);
    });
  }

  var lastScrollId = null;

  function scrollNext(gesture, forward) {
    if (typeof forward === 'undefined') {
      //console.log('scroll next')
      if (lastScrollId === gesture.id) {
        return;
      }
      lastScrollId = gesture.id;
      //console.log(frame);
      if (Math.abs(gesture.direction[2]) > Math.abs(0.3)) {
        forward = Math.round(gesture.direction[2] * 5);
        console.log(forward);
      };

    }

    scrollTo(Math.floor(numElements / 2) + (forward));
  }

  //var lastPullOutId = null
  var isPulledOut = false;

  function pullOut(key) {
    /*if (lastPullOutId === gesture.id) {
      return;
    }
    lastPullOutId = gesture.id;*/

    if (isPulledOut) {
      return scrollTo(Math.floor(numElements / 2));
    }

    isPulledOut = true;
    var el = elements[Math.floor(numElements / 2)];
    el.transform.set(
      Transform.translate(size, el.offsets.y, el.offsets.z),
      transition);
    play();
  }

  window.scrollTo = scrollTo;
  window.pullOut = pullOut;

  $(function() {
    SC.initialize({
      client_id: "20a5b7cf9c33e86431f5148a15ee5a3d",
      redirect_uri: "http://localhost:3000/soundcloud"
    });
    $.ajax({
      method: 'GET',
      url: 'http://localhost:3000/traverseGraph',
      xhrFields: {
        withCredentials: true
      }
    }).then(function(d) {
      console.log(d);
      d = _.shuffle(d);
      for (var i = 0; i < d.length; i++) {
        addPane(tree, i, d[i]);
      }
    });

    $(window).bind('keydown', function(e) {
      var k = e.keyCode;
      if (k === 39 || k === 38) {
        scrollNext(null, true);
      }
      if (k === 37 || k === 40) {
        scrollNext(null, false);
      }
      if (k === 32) {
        pullOut();
      }
      if (k === 80) {
        play();
      }
    });
  });

  function distance(v1, v2) {
    var sum = _.reduce(_.zip(v1, v2), function(sum, xs) {
      return sum + Math.pow(xs[0] - xs[1], 2);
    }, 0);
    return Math.sqrt(sum);
  }

  var nameMap = ['thumb', 'index', 'middle', 'ring', 'pinky'];

  var pinchTimes = 0;

  function isPinch(fingers) {

    var thumb = _.find(fingers, function(finger) {
      return nameMap[finger.type] === 'thumb';
    });

    if (!thumb || !thumb.tipPosition) {
      return false;
    }
    var distanceTotal = _.reduce(fingers, function(sum, finger2) {
      return sum + distance(thumb.tipPosition, finger2.tipPosition);
    }, 0) / fingers.length;
    if (distanceTotal < 25) {
      pinchTimes += 1;
      if (pinchTimes > 10) {
        return true;
      }
    } else {
      pinchTimes = 0;
    }
    return false;
  }

  var playing = false;
  var sound = {},
    soundId;

  function play(id) {
    var el = elements[Math.floor(numElements / 2)];
    id = id ? id : $('[data-index=' + el.i + ']')[0].id;
    var name = $('[data-index=' + el.i + ']').data('name');
    $('.tracktitle').html(name);
    console.log(name);
    console.log(soundId, id);

    $('.twitter-share-button a').attr('href', 'https://twitter.com/share?url=https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/' + id + '&amp;color=ff6600&amp;auto_play=false&amp;show_artwork=true');
    if (soundId == id && playing) {
      console.log('pause');
      sound.stop();
      playing = false;
      $('.pause').html('<i class="fa fa-play"></i>');


    } else if (soundId == id && !playing) {
      sound.play();
      playing = true;
      $('.pause').html('<i class="fa fa-pause"></i>');

    } else if (sound.sID) {
      console.log('pause');
      sound.stop();
      SC.stream("/tracks/" + id, function(s) {
        sound = s;
        sound._onfinish(function() {
          var currIndex = $('#' + id).data('index');

          play($('[data-index=' + currIndex + 1 + ']')[0].id);
        });
        soundId = id;
        s.play();
      });
      $('.pause').html('<i class="fa fa-pause"></i>');
      playing = true;
    } else {
      console.log('play');

      SC.stream("/tracks/" + id, function(s) {
        sound = s;
        console.log(s);
        soundId = id;
        sound._whileplaying(function(d) {
          console.log(d);
        });
        sound._onfinish(function() {
          var currIndex = $('#' + id).data('index');

          play($('[data-index=' + currIndex + 1 + ']')[0].id);
        });
        s.play();
      });
      $('.pause').html('<i class="fa fa-pause"></i>');
      playing = true;

    }
  }

  var controllerOptions = {
    enableGestures: true
  };
  var scrollNextThrottled = _.throttle(scrollNext, 500);
  var pullOutThrottled = _.throttle(pullOut, 1600);
  var playThrottled = _.throttle(play, 1000);
  var pinching = false;
  Leap.loop(controllerOptions, function(frame) {
    // Body of callback function
    // Display Gesture object data
    var isP = isPinch(frame.fingers);
    if (!isP && frame.gestures.length > 0) {
      for (var i = 0, l = frame.gestures.length; i < l; i++) {
        var gesture = frame.gestures[i];
        if (gesture.type === 'swipe') {
          scrollNextThrottled(gesture);
        } else if (gesture.type === 'screenTap') {
          //playThrottled();
        }
        /*else if (gesture.type === 'keyTap') {
          pullOutThrottled(gesture);
        }*/
      }
    } else if (!pinching && isP) {
      pinching = true;
      pullOutThrottled();
    } else if (!isPinch(frame.fingers)) {
      pinching = false;
    }
  });
});