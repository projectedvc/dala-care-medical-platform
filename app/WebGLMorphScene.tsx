"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type TargetSet = Float32Array[];

const VERTEX_SHADER = /* glsl */ `
  precision highp float;

  attribute vec3 aFrom;
  attribute vec3 aTo;
  attribute vec3 aRandom;
  attribute float aSeed;

  uniform float uTime;
  uniform float uMorph;
  uniform float uScatter;
  uniform float uMouseForce;
  uniform float uPixelRatio;
  uniform float uViewportAspect;
  uniform float uStage;
  uniform float uScrollPhase;
  uniform float uFloatStrength;
  uniform float uVolumeStrength;
  uniform float uMotionStrength;
  uniform vec2 uMouse;
  uniform vec2 uParallax;
  uniform vec3 uFormCenter;

  varying vec3 vColor;
  varying float vAlpha;
  varying vec2 vLocal;
  varying float vDepth;
  varying float vGlint;
  varying float vFacetLight;

  float easeInOut(float t) {
    // Cubic easing starts travelling earlier than the old quintic curve. This
    // keeps every form visibly connected to the next instead of holding and
    // then appearing to snap into place near the middle of the section.
    return t * t * (3.0 - 2.0 * t);
  }

  void main() {
    float eased = easeInOut(clamp(uMorph, 0.0, 1.0));
    // Ignite the bulb early, then let it peel continuously into the turbine.
    // Keeping this interval broad prevents a long hold followed by a snap.
    float bulbSegment = step(2.0, uStage) * (1.0 - step(3.0, uStage));
    float bulbMorph = easeInOut(clamp((uMorph - 0.04) / 0.92, 0.0, 1.0));
    float orbitSegment = step(5.0, uStage) * (1.0 - step(6.0, uStage));
    float orbitMorph = easeInOut(clamp((uMorph - 0.02) / 0.96, 0.0, 1.0));
    float hubSegment = step(7.0, uStage) * (1.0 - step(8.0, uStage));
    float hubMorph = easeInOut(clamp((uMorph - 0.02) / 0.96, 0.0, 1.0));
    eased = mix(eased, bulbMorph, bulbSegment);
    eased = mix(eased, orbitMorph, orbitSegment);
    eased = mix(eased, hubMorph, hubSegment);
    float heroStage = 1.0 - smoothstep(0.06, 0.64, uStage);
    vec3 center = mix(aFrom, aTo, eased);

    // Travel through a soft arc instead of marching from A to B in a straight line.
    // The arc collapses at both ends, so every silhouette still lands precisely.
    vec3 travel = aTo - aFrom;
    vec3 arcVector = cross(
      travel + vec3(0.17, 0.09, 0.13),
      aRandom + vec3(0.31, 0.47, 0.73)
    );
    vec3 arcDirection = arcVector / max(length(arcVector), 0.001);
    float pathArc = sin(eased * 3.14159265);
    float travelDistance = min(length(travel), 3.2);
    center += arcDirection * pathArc * (0.075 + travelDistance * 0.07)
      * mix(1.0, 0.3, orbitSegment)
      * (0.88 + sin(uTime * 0.24 + aSeed * 19.0) * 0.12);

    // DNA unwinds into one orbital axis around a shared centre. Interpolating
    // angle and radius keeps the travelling field cohesive, so it never reads
    // as two unrelated clouds before the final ellipse appears.
    vec3 orbitBridgeCenter = vec3(-1.65, 0.02, 0.0);
    vec3 orbitFrom = aFrom - orbitBridgeCenter;
    vec3 orbitTo = aTo - orbitBridgeCenter;
    float orbitFromAngle = atan(orbitFrom.y, orbitFrom.x);
    float orbitToAngle = atan(orbitTo.y, orbitTo.x);
    float orbitDelta = atan(
      sin(orbitToAngle - orbitFromAngle),
      cos(orbitToAngle - orbitFromAngle)
    );
    float orbitBridgeLift = sin(eased * 3.14159265);
    float orbitBridgeAngle = orbitFromAngle + orbitDelta * eased
      + (aSeed - 0.5) * orbitBridgeLift * 0.16;
    float orbitBridgeRadius = mix(length(orbitFrom.xy), length(orbitTo.xy), eased);
    vec3 cohesiveOrbit = orbitBridgeCenter + vec3(
      cos(orbitBridgeAngle) * orbitBridgeRadius,
      sin(orbitBridgeAngle) * orbitBridgeRadius,
      mix(orbitFrom.z, orbitTo.z, eased)
        + sin(aSeed * 31.0 + uTime * 0.12) * orbitBridgeLift * 0.07
    );
    center = mix(center, cohesiveOrbit, orbitSegment * 0.96);

    // Once the lamp has reached its white-hot state, its particles peel away
    // from the glass instead of simply interpolating into the next silhouette.
    float bulbDeparture = smoothstep(2.08, 2.24, uStage)
      * (1.0 - smoothstep(2.8, 2.98, uStage));
    vec3 bulbSource = aFrom - vec3(-1.85, 0.05, 0.0);
    vec3 bulbBlastDirection = normalize(bulbSource + aRandom * 0.18 + vec3(0.0, 0.08, 0.12));
    center += bulbBlastDirection * bulbDeparture * pathArc * (0.12 + aSeed * 0.34);

    // Do not split the investor rings into two rigid columns. The generic arc
    // now carries every shard continuously into its hand target; the hand pose
    // below supplies the cinematic left/right arrival and 3D turn.

    float turbineStage = smoothstep(2.68, 2.96, uStage) * (1.0 - smoothstep(3.2, 3.58, uStage));
    vec3 turbineCenter = vec3(2.08, 0.0, 0.12);
    float turbinePhase = 0.0;
    if (center.z < -0.52 && center.y > 0.0) {
      turbineCenter = vec3(3.82, 1.45, -1.15);
      turbinePhase = 2.1;
    } else if (center.z < -0.52) {
      turbineCenter = vec3(3.88, -1.42, -1.28);
      turbinePhase = 4.2;
    }
    float turbineRadius = length(center - turbineCenter);
    float turbineAngle = sin(uTime * 0.18 + turbinePhase) * 0.2 * uMotionStrength;
    mat3 rotateTurbine = mat3(
      cos(turbineAngle), -sin(turbineAngle), 0.0,
      sin(turbineAngle), cos(turbineAngle), 0.0,
      0.0, 0.0, 1.0
    );
    vec3 rotatedTurbine = turbineCenter + rotateTurbine * (center - turbineCenter);
    center = mix(center, rotatedTurbine, turbineStage);

    float atomStage = smoothstep(3.62, 3.94, uStage) * (1.0 - smoothstep(4.12, 4.48, uStage));
    vec3 mainAtomCenter = vec3(-2.48, 0.0, 0.0);
    vec3 upperAtomCenter = vec3(-0.9, 1.27, -0.42);
    vec3 lowerAtomCenter = vec3(-0.78, -1.27, 0.38);
    float mainDistance = distance(center, mainAtomCenter);
    float upperDistance = distance(center, upperAtomCenter);
    float lowerDistance = distance(center, lowerAtomCenter);
    float atomForeground = 1.0 - step(1.78, min(mainDistance, min(upperDistance, lowerDistance)));
    vec3 atomCenter = mainAtomCenter;
    float atomPhase = 0.0;
    if (upperDistance < mainDistance && upperDistance < lowerDistance) {
      atomCenter = upperAtomCenter;
      atomPhase = 2.1;
    } else if (lowerDistance < mainDistance) {
      atomCenter = lowerAtomCenter;
      atomPhase = 4.2;
    }
    float atomAngle = sin(uTime * 0.14 + atomPhase) * 0.12 * uMotionStrength;
    mat3 rotateAtomZ = mat3(
      cos(atomAngle), -sin(atomAngle), 0.0,
      sin(atomAngle), cos(atomAngle), 0.0,
      0.0, 0.0, 1.0
    );
    float atomTilt = atomAngle * 0.62;
    mat3 rotateAtomX = mat3(
      1.0, 0.0, 0.0,
      0.0, cos(atomTilt), -sin(atomTilt),
      0.0, sin(atomTilt), cos(atomTilt)
    );
    vec3 rotatedAtom = atomCenter + rotateAtomX * rotateAtomZ * (center - atomCenter);
    center = mix(center, rotatedAtom, atomStage * atomForeground);

    // The single particle axis only tilts slightly with scroll.
    float investorMotionStage = smoothstep(5.7, 5.96, uStage) * (1.0 - smoothstep(6.34, 6.72, uStage));
    vec3 investorCenter = vec3(-1.65, 0.02, 0.0);
    float investorTilt = sin(uScrollPhase * 0.45) * 0.12 * uMotionStrength;
    mat3 rotateInvestorY = mat3(
      cos(investorTilt), 0.0, sin(investorTilt),
      0.0, 1.0, 0.0,
      -sin(investorTilt), 0.0, cos(investorTilt)
    );
    vec3 tiltedInvestor = investorCenter + rotateInvestorY * (center - investorCenter);
    center = mix(center, tiltedInvestor, investorMotionStage);

    // Keep the surrounding team field calm while the DNA signal itself turns.
    float teamMotionStage = smoothstep(4.68, 4.98, uStage) * (1.0 - smoothstep(5.7, 6.02, uStage));
    float dnaMask = (1.0 - smoothstep(0.82, 1.52, abs(center.x)))
      * (1.0 - smoothstep(2.02, 2.62, abs(center.y)));
    float dnaAngle = uTime * 0.23 * uMotionStrength;
    mat3 rotateDnaY = mat3(
      cos(dnaAngle), 0.0, sin(dnaAngle),
      0.0, 1.0, 0.0,
      -sin(dnaAngle), 0.0, cos(dnaAngle)
    );
    vec3 rotatedDna = rotateDnaY * center;
    center = mix(center, rotatedDna, teamMotionStage * dnaMask);

    vec3 localShape = center - uFormCenter;
    float volumeRotation = uVolumeStrength * uMotionStrength;
    float atomBackdrop = atomStage * (1.0 - atomForeground);
    volumeRotation *= 1.0 - atomBackdrop * 0.78;
    // Rock the volume inside a narrow arc instead of accumulating full turns.
    // Thin particle silhouettes otherwise spend too much time edge-on to camera.
    float yAngle = sin(uTime * 0.11) * 0.42 * volumeRotation * (1.0 - heroStage * 0.94);
    float xAngle = sin(uTime * 0.08 + 0.7) * 0.11 * volumeRotation * (1.0 - heroStage * 0.9);
    mat3 rotateY = mat3(
      cos(yAngle), 0.0, sin(yAngle),
      0.0, 1.0, 0.0,
      -sin(yAngle), 0.0, cos(yAngle)
    );
    mat3 rotateX = mat3(
      1.0, 0.0, 0.0,
      0.0, cos(xAngle), -sin(xAngle),
      0.0, sin(xAngle), cos(xAngle)
    );
    localShape = rotateX * rotateY * localShape;

    // The hero is a continuously advecting energy stream, not a frozen tunnel.
    // Wall and core particles loop from the left aperture to the right while
    // the two dense end rings rotate in place and replenish the current.
    float heroSpin = sin(uTime * 0.16) * 0.105 * uMotionStrength;
    float heroNod = sin(uTime * 0.21) * 0.055 * uMotionStrength;
    mat3 rotateHeroY = mat3(
      cos(heroSpin), 0.0, sin(heroSpin),
      0.0, 1.0, 0.0,
      -sin(heroSpin), 0.0, cos(heroSpin)
    );
    mat3 rotateHeroX = mat3(
      1.0, 0.0, 0.0,
      0.0, cos(heroNod), -sin(heroNod),
      0.0, sin(heroNod), cos(heroNod)
    );
    localShape = mix(localShape, rotateHeroX * rotateHeroY * localShape, heroStage);
    vec3 heroSource = aFrom - vec3(0.18, 0.0, 0.0);
    float leftRingMask = 1.0 - smoothstep(0.5, 0.82, abs(heroSource.x + 4.75));
    float rightRingMask = 1.0 - smoothstep(0.5, 0.82, abs(heroSource.x - 4.15));
    float heroRingMask = max(leftRingMask, rightRingMask);
    float baseProgress = clamp((heroSource.x + 4.75) / 8.9, 0.0, 1.0);
    float flowSpeed = 0.052 + fract(aSeed * 17.37) * 0.026;
    float flowProgress = fract(baseProgress + uTime * flowSpeed);
    float baseAngle = atan(heroSource.z, heroSource.y);
    float streamAngle = baseAngle + flowProgress * 7.4 + uTime * 0.18;
    float streamRadius = max(0.025, length(heroSource.yz));
    float radiusPulse = 1.0 + sin(uTime * 0.42 - flowProgress * 12.0 + aSeed * 8.0) * 0.035;
    vec3 flowingHero = vec3(
      mix(-4.75, 4.15, flowProgress) - sin(streamAngle) * streamRadius * 0.11,
      cos(streamAngle) * streamRadius * radiusPulse,
      sin(streamAngle) * streamRadius * radiusPulse
    );
    float ringDirection = mix(-1.0, 1.0, leftRingMask);
    float ringAngle = baseAngle + uTime * 0.24 * ringDirection;
    float ringCenterX = mix(4.15, -4.75, leftRingMask);
    vec3 rotatingRing = vec3(
      ringCenterX - sin(ringAngle) * streamRadius * 0.36,
      cos(ringAngle) * streamRadius * 0.86,
      sin(ringAngle) * streamRadius
    );
    vec3 animatedHero = mix(flowingHero, rotatingRing, heroRingMask);
    // Fit the field to the actual viewport rather than assuming a fixed 16:9
    // canvas. Wide displays receive a longer, slightly lower stream.
    float heroAspectScale = clamp(uViewportAspect / 1.68, 0.88, 1.16);
    float wideViewport = smoothstep(1.58, 1.96, uViewportAspect);
    animatedHero.x = animatedHero.x * heroAspectScale + wideViewport * 0.24;
    animatedHero.y *= mix(1.02, 0.94, wideViewport);
    localShape = mix(localShape, animatedHero, heroStage * uMotionStrength);

    center = uFormCenter + localShape;

    float handStage = smoothstep(6.18, 6.82, uStage) * (1.0 - smoothstep(7.56, 7.9, uStage));
    float handArrival = smoothstep(6.08, 6.94, uStage);
    float handHold = smoothstep(6.82, 6.98, uStage) * (1.0 - smoothstep(7.12, 7.3, uStage));
    // While entering, aTo is the hand target. While leaving, aFrom is. Keeping
    // that identity stable prevents both hands from being classified as left.
    float handSide = uStage < 7.0 ? sign(aTo.x) : sign(aFrom.x);
    vec3 handPivot = vec3(handSide * 2.72, 0.24, 0.0);
    float handYaw = handSide * mix(0.92, 0.27, handArrival) * uMotionStrength;
    handYaw += handSide * sin(uTime * 0.42 + aSeed * 0.04) * 0.035 * handStage;
    float handPitch = handSide * mix(-0.34, 0.07, handArrival) * uMotionStrength;
    handPitch += sin(uTime * 0.31 + handSide * 1.7) * 0.035 * handStage;
    float handRoll = handSide * mix(0.25, -0.025, handArrival) * uMotionStrength;
    mat3 rotateHandY = mat3(
      cos(handYaw), 0.0, sin(handYaw),
      0.0, 1.0, 0.0,
      -sin(handYaw), 0.0, cos(handYaw)
    );
    mat3 rotateHandX = mat3(
      1.0, 0.0, 0.0,
      0.0, cos(handPitch), -sin(handPitch),
      0.0, sin(handPitch), cos(handPitch)
    );
    mat3 rotateHandZ = mat3(
      cos(handRoll), -sin(handRoll), 0.0,
      sin(handRoll), cos(handRoll), 0.0,
      0.0, 0.0, 1.0
    );
    vec3 dimensionalHand = handPivot + rotateHandZ * rotateHandX * rotateHandY * (center - handPivot);
    // The wrists come from outside the frame, turn toward camera and settle
    // horizontally at the same composition as before.
    dimensionalHand.x += handSide * (1.0 - handArrival) * 1.14;
    dimensionalHand.y += handSide * (1.0 - handArrival) * 0.24;
    dimensionalHand.z += (1.0 - handArrival) * 0.58;
    center = mix(center, dimensionalHand, handStage);
    // The touch is held before the burst. Disintegration starts only after the
    // fingers have met, then peaks while the next form begins to assemble.
    float handExit = smoothstep(7.08, 7.48, uStage) * (1.0 - smoothstep(7.68, 7.9, uStage));
    float contactOrder = 1.0 - smoothstep(0.1, 4.5, length(center.xy));
    vec3 handScatterDirection = normalize(
      vec3(center.x, center.y * 0.82, center.z * 0.92) + aRandom * 1.18 + vec3(0.0001)
    );
    center += handScatterDirection * handExit * (0.34 + contactOrder * 0.88 + aSeed * 0.52);

    float energyHubStage = smoothstep(7.18, 7.82, uStage);
    float lightningCore = energyHubStage
      * (1.0 - smoothstep(0.72, 1.14, abs(localShape.x)));
    float lightningJitter = sin(uTime * 5.4 + aSeed * 61.0) * 0.017 * lightningCore;
    center.x += lightningJitter;
    center.z += cos(uTime * 4.7 + aSeed * 43.0) * 0.012 * lightningCore;

    float transition = sin(eased * 3.14159265);
    float wave = sin(uTime * (0.28 + aSeed * 0.52) + aSeed * 38.0);
    float floatPhase = uTime * (0.12 + aSeed * 0.18) + aSeed * 71.0;
    float shapeRigidity = 1.0 - max(atomStage * 0.86, turbineStage * 0.58);
    shapeRigidity *= 1.0 - orbitSegment * 0.72;
    float floatAmount = mix(0.025, 0.058, fract(aSeed * 9.17)) * uFloatStrength * shapeRigidity;
    vec3 buoyancy = vec3(
      sin(floatPhase + aRandom.z * 5.0),
      cos(floatPhase * 0.73 + aRandom.x * 6.0),
      sin(floatPhase * 0.57 + aRandom.y * 4.0)
    ) * floatAmount;
    vec3 drift = buoyancy + aRandom * wave * (0.018 * shapeRigidity + transition * uScatter);
    drift += vec3(
      sin(center.y * 2.1 + uTime * 0.22 + aSeed * 12.0),
      cos(center.x * 1.8 - uTime * 0.18 + aSeed * 8.0),
      sin(center.x * 1.4 + center.y * 1.1 + uTime * 0.16)
    ) * (0.012 * uFloatStrength * shapeRigidity + transition * 0.055);
    // During the middle of a morph the shards separate before finding the next form.
    vec3 scatterDirection = normalize(aRandom + localShape * 0.16 + vec3(0.0001));
    center += scatterDirection * transition * uScatter * (0.28 + aSeed * 0.6)
      * mix(1.0, 0.24, orbitSegment);
    float heroDeparture = (1.0 - smoothstep(0.82, 1.0, uStage)) * transition;
    center += normalize(aRandom + localShape * 0.2 + vec3(0.0001))
      * heroDeparture * (0.22 + aSeed * 0.46);
    center += drift;
    center.xy += uParallax * center.z * 0.075 * (1.0 - handStage * 0.82);

    vec2 away = center.xy - uMouse;
    float distanceToPointer = length(away);
    float pointerField = 1.0 - smoothstep(0.0, 0.86, distanceToPointer);
    vec2 direction = away / max(distanceToPointer, 0.025);
    center.xy += direction * pointerField * pointerField * uMouseForce;

    float shardSpinZ = aSeed * 19.0 + uTime * (0.11 + aSeed * 0.24);
    float shardSpinX = aSeed * 11.0 - uTime * (0.07 + aSeed * 0.13);
    mat3 shardRotationZ = mat3(
      cos(shardSpinZ), -sin(shardSpinZ), 0.0,
      sin(shardSpinZ), cos(shardSpinZ), 0.0,
      0.0, 0.0, 1.0
    );
    mat3 shardRotationX = mat3(
      1.0, 0.0, 0.0,
      0.0, cos(shardSpinX), -sin(shardSpinX),
      0.0, sin(shardSpinX), cos(shardSpinX)
    );

    vec4 centerViewPosition = modelViewMatrix * vec4(center, 1.0);
    float shardDepth = smoothstep(-9.55, -6.85, centerViewPosition.z);
    float size = mix(0.0115, 0.033, pow(aSeed, 3.2));
    size *= 0.84 + transition * 0.4;
    size *= mix(0.72, 1.32, shardDepth);
    size *= 1.0 - atomStage * 0.28;
    size *= 1.0 - atomBackdrop * 0.12;
    size *= 1.0 - handStage * 0.08;
    size *= 1.0 - heroStage * 0.26;

    vec3 shardVertex = shardRotationX * shardRotationZ * position * size;
    float heroStreakPulse = pow(
      0.5 + 0.5 * sin(uTime * 0.85 - center.x * 3.2 + aSeed * 4.8),
      8.0
    );
    shardVertex.x *= 1.0 + heroStage * (1.35 + heroStreakPulse * 0.85);
    shardVertex.yz *= 1.0 - heroStage * 0.26;
    vec3 shardNormal = normalize(shardRotationX * shardRotationZ * normal);
    vec4 viewPosition = modelViewMatrix * vec4(center + shardVertex, 1.0);
    vec3 viewNormal = normalize(normalMatrix * shardNormal);
    vFacetLight = 0.3 + max(dot(viewNormal, normalize(vec3(-0.42, 0.62, 0.75))), 0.0) * 0.95;
    float particleDepth = smoothstep(-9.55, -6.85, viewPosition.z);
    gl_Position = projectionMatrix * viewPosition;

    vec3 amber = vec3(0.18, 0.88, 0.82);
    vec3 gold = vec3(0.56, 0.96, 0.93);
    vec3 violet = vec3(0.55, 0.48, 1.0);
    vec3 green = vec3(0.27, 0.94, 0.66);
    vec3 whiteHot = vec3(0.92, 1.0, 0.99);

    float variant = fract(aSeed * 31.71);
    vColor = mix(amber, gold, fract(aSeed * 7.2));
    if (variant > 0.875) vColor = violet;
    if (variant > 0.948) vColor = green;
    if (variant > 0.985) vColor = whiteHot;

    vec3 heroLocal = center - uFormCenter;
    float heroRadius2d = length(heroLocal.xy);
    float heroFront = smoothstep(-0.38, 0.52, heroLocal.z);
    float heroFlux = pow(0.5 + 0.5 * sin(uTime * 0.85 - heroLocal.x * 3.2 + aSeed * 4.8), 9.0);
    vec3 heroColor = mix(gold, whiteHot, 0.58 + heroFront * 0.24 + heroFlux * 0.18);
    if (variant > 0.94) heroColor = mix(heroColor, violet, 0.42);
    if (variant > 0.978) heroColor = mix(heroColor, green, 0.48);
    vColor = mix(vColor, heroColor, heroStage * 0.97);

    if (uStage > 6.45) {
      float rainbow = fract(aSeed * 13.17);
      if (rainbow > 0.64) vColor = violet;
      if (rainbow > 0.81) vColor = green;
      if (rainbow > 0.93) vColor = whiteHot;
    }

    // Each lightning cluster in the final composition receives its own energy
    // colour, while a moving white crest makes the current visibly travel.
    float finalStage = smoothstep(7.42, 7.88, uStage);
    vec3 finalColor = gold;
    if (center.x < -3.35 && center.y > 0.0) finalColor = whiteHot;
    if (center.x < -3.35 && center.y <= 0.0) finalColor = violet;
    if (center.x > -1.5 && center.y > 0.35) finalColor = violet;
    if (center.x > -1.55 && center.y < -0.45) finalColor = green;
    if (center.x > -0.45 && abs(center.y) < 0.65) finalColor = amber;
    float finalCurrent = pow(
      0.5 + 0.5 * sin(uTime * 2.35 - center.y * 4.1 + aSeed * 2.7),
      8.0
    );
    vColor = mix(vColor, finalColor, finalStage * 0.9);
    vColor += whiteHot * finalStage * finalCurrent * 0.72;

    vec3 volumeNormal = normalize(center - uFormCenter + vec3(0.0001));
    vec3 keyLight = normalize(vec3(-0.48, 0.62, 0.72));
    float diffuse = 0.34 + max(dot(volumeNormal, keyLight), 0.0) * 1.28;
    float rim = pow(1.0 - abs(dot(volumeNormal, vec3(0.0, 0.0, 1.0))), 2.0) * 0.28;
    float volumeLight = diffuse + rim;

    vec3 coolShadow = vColor * vec3(0.32, 0.62, 0.72);
    vColor = mix(coolShadow, vColor * 1.32, particleDepth);
    vColor *= mix(1.0, volumeLight, uVolumeStrength);
    vAlpha = mix(0.22, 1.0, particleDepth) * mix(0.55, 1.0, fract(aSeed * 17.0));
    vColor += whiteHot * heroStage * (0.18 + heroFront * 0.3 + heroFlux * 0.72);
    vAlpha = min(1.0, vAlpha + heroStage * (0.22 + heroFlux * 0.24));
    vColor *= 1.0 + atomBackdrop * 0.14;
    vAlpha *= 1.0 - atomBackdrop * 0.38;

    float rightHand = smoothstep(-0.08, 0.08, handSide);
    float handSurfaceDepth = smoothstep(-0.7, 0.72, center.z);
    float handDepthLight = mix(0.34, 1.58, handSurfaceDepth);
    float handSpecular = pow(max(0.0, dot(
      normalize(vec3(center.x - handSide * 2.7, center.y - 0.2, center.z + 0.1)),
      normalize(vec3(-0.34 * handSide, 0.72, 0.62))
    )), 5.0);
    vec3 leftHandColor = mix(vColor * 0.58, vColor * 1.42, handSurfaceDepth);
    vec3 rightHandColor = mix(vec3(0.18, 0.42, 0.48), vec3(0.92, 1.0, 0.99), handSurfaceDepth);
    vec3 handColor = mix(leftHandColor, rightHandColor, rightHand) * handDepthLight;
    handColor += whiteHot * handSpecular * mix(0.55, 1.05, rightHand);
    vColor = mix(vColor, handColor, handStage * 0.96);
    vAlpha = min(1.0, vAlpha + handStage * mix(0.12, 0.26, rightHand));

    float contactGlow = max(handHold, handStage * 0.18) * (1.0 - smoothstep(0.05, 0.52, length(center.xy)))
      * (0.76 + sin(uTime * 3.2) * 0.24);
    vColor += whiteHot * contactGlow * 1.45;
    vAlpha = min(1.0, vAlpha + contactGlow * 0.72);

    // The filament is white at rest. During the first part of the next scroll
    // the shell ignites, then immediately starts feeding the turbine form.
    float bulbStage = smoothstep(1.34, 1.8, uStage) * (1.0 - smoothstep(2.66, 2.94, uStage));
    vec3 bulbLocal = center - vec3(-1.85, 0.05, 0.0);
    float bulbHead = smoothstep(-0.58, -0.08, bulbLocal.y);
    float bulbCore = bulbStage * bulbHead
      * (1.0 - smoothstep(0.16, 0.68, length(vec3(bulbLocal.x, bulbLocal.y - 0.4, bulbLocal.z))));
    float bulbFull = bulbStage * smoothstep(2.08, 2.3, uStage);
    float bulbLit = max(bulbCore, bulbFull);
    float bulbPulse = 0.86 + sin(uTime * 3.8 - bulbLocal.y * 3.0) * 0.14;
    vColor = mix(vColor, whiteHot * (1.12 + bulbPulse * 0.22), bulbLit * 0.94);
    vAlpha = min(1.0, vAlpha + bulbLit * (0.24 + bulbPulse * 0.18));

    // A readable wake follows the rotor arcs and wind ribbons.
    float turbineTrace = turbineStage
      * pow(0.5 + 0.5 * sin(uTime * 1.7 - turbineRadius * 3.1 + aSeed * 0.35), 6.0);
    vColor += vec3(0.18, 0.9, 0.83) * turbineTrace * 0.58;
    vAlpha = min(1.0, vAlpha + turbineTrace * 0.38 + turbineStage * 0.08);

    // Two travelling hot bands turn the last bolt into a continuous current.
    float lightningPhaseA = fract((localShape.y + 1.72) * 0.31 - uTime * 0.62);
    float lightningPhaseB = fract(lightningPhaseA + 0.5);
    float lightningFlow = max(
      pow(1.0 - abs(lightningPhaseA * 2.0 - 1.0), 11.0),
      pow(1.0 - abs(lightningPhaseB * 2.0 - 1.0), 11.0)
    ) * lightningCore;
    vColor += whiteHot * (lightningCore * 0.1 + lightningFlow * 1.18);
    vAlpha = min(1.0, vAlpha + lightningCore * 0.08 + lightningFlow * 0.74);

    float teamStage = smoothstep(5.08, 5.46, uStage) * (1.0 - smoothstep(6.14, 6.5, uStage));
    float investorStage = smoothstep(6.12, 6.48, uStage) * (1.0 - smoothstep(6.72, 7.02, uStage));
    float quietStage = max(teamStage * 0.18, investorStage * 0.25);
    float luminance = dot(vColor, vec3(0.2126, 0.7152, 0.0722));
    vec3 quietGold = mix(vec3(luminance) * vec3(0.58, 0.94, 0.92), vColor, 0.48);
    vColor = mix(vColor, quietGold, max(teamStage, investorStage) * 0.7);
    vAlpha *= 1.0 - quietStage;

    // Keep the DNA-to-orbit transfer fully visible. The spatial curl above
    // supplies the breakup, so an opacity gap would make planets appear from
    // nowhere instead of being assembled from the DNA particles.
    // A dedicated anatomical hand cloud is rendered for this scene. Suppress
    // the generic morph mesh so orbit particles never masquerade as forearms.
    float dedicatedHandWindow = smoothstep(6.08, 6.4, uStage)
      * (1.0 - smoothstep(7.3, 7.66, uStage));
    vAlpha *= 1.0 - dedicatedHandWindow * 0.995;
    vLocal = position.xy;
    vDepth = particleDepth;
    vGlint = step(0.97, fract(aSeed * 23.71)) * particleDepth;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;
  varying vec3 vColor;
  varying float vAlpha;
  varying vec2 vLocal;
  varying float vDepth;
  varying float vGlint;
  varying float vFacetLight;

  void main() {
    float centerGlow = 1.0 - smoothstep(0.08, 0.82, length(vLocal));
    float glow = 0.84 + centerGlow * 0.38 + vGlint * 1.55;
    float depthHaze = mix(0.78, 1.14, vDepth);
    gl_FragColor = vec4(vColor * glow * depthHaze * vFacetLight, vAlpha);
  }
`;

const HAND_VERTEX_SHADER = /* glsl */ `
  precision highp float;

  attribute vec3 aPosition;
  attribute vec3 aRandom;
  attribute vec3 aSurfaceNormal;
  attribute float aSeed;
  attribute float aTone;

  uniform float uTime;
  uniform float uStage;
  uniform float uMotionStrength;
  uniform vec2 uParallax;

  varying vec3 vColor;
  varying float vAlpha;
  varying vec2 vLocal;
  varying float vDepth;
  varying float vGlint;
  varying float vFacetLight;

  void main() {
    float rightHand = step(0.0, aPosition.x);
    float side = mix(-1.0, 1.0, rightHand);
    // The two wrists enter on different beats. This slight timing mismatch is
    // deliberate: a human encounter does not look like a mirrored logo reveal.
    float leftArrival = smoothstep(5.88, 6.76, uStage);
    float rightArrival = smoothstep(5.98, 6.9, uStage);
    float arrival = mix(leftArrival, rightArrival, rightHand);
    float visibleIn = mix(
      smoothstep(5.94, 6.24, uStage),
      smoothstep(6.04, 6.34, uStage),
      rightHand
    );
    float exit = smoothstep(7.08, 7.58, uStage);
    float visibleOut = 1.0 - smoothstep(7.44, 7.72, uStage);

    vec3 sourcePivot = vec3(side * 2.33, 0.02, 0.0);
    vec3 pivot = mix(
      vec3(-2.3, -0.12, -0.1),
      vec3(2.28, 0.08, 0.14),
      rightHand
    );
    vec3 local = aPosition - sourcePivot;
    // The final pose stays slightly turned. This exposes the reconstructed
    // palm/finger thickness instead of flattening the hands against camera.
    float yaw = mix(
      mix(-1.08, -0.075, arrival),
      mix(1.2, 0.055, arrival),
      rightHand
    ) * uMotionStrength;
    yaw += mix(-1.0, 0.72, rightHand)
      * sin(uTime * 0.72 + side) * 0.064 * arrival * (1.0 - exit);
    float pitch = mix(
      mix(0.32, -0.045, arrival),
      mix(-0.4, 0.075, arrival),
      rightHand
    ) * uMotionStrength;
    pitch += sin(uTime * 0.58 + mix(0.2, 1.45, rightHand))
      * 0.038 * arrival * (1.0 - exit) * uMotionStrength;
    float roll = mix(
      mix(-0.18, 0.025, arrival),
      mix(0.22, -0.018, arrival),
      rightHand
    ) * uMotionStrength;
    roll += sin(uTime * 0.49 + mix(1.1, 2.4, rightHand))
      * mix(0.026, -0.034, rightHand) * arrival * (1.0 - exit) * uMotionStrength;

    mat3 rotateY = mat3(
      cos(yaw), 0.0, sin(yaw),
      0.0, 1.0, 0.0,
      -sin(yaw), 0.0, cos(yaw)
    );
    mat3 rotateX = mat3(
      1.0, 0.0, 0.0,
      0.0, cos(pitch), -sin(pitch),
      0.0, sin(pitch), cos(pitch)
    );
    mat3 rotateZ = mat3(
      cos(roll), -sin(roll), 0.0,
      sin(roll), cos(roll), 0.0,
      0.0, 0.0, 1.0
    );

    vec3 center = pivot + rotateZ * rotateX * rotateY * local;
    center.x += side * (1.0 - arrival) * mix(5.25, 4.72, rightHand);
    center.y += (1.0 - arrival) * mix(-0.56, 0.38, rightHand);
    center.z += (1.0 - arrival) * mix(1.12, 1.46, rightHand);

    float contact = smoothstep(6.76, 6.96, uStage) * (1.0 - exit);
    // After arriving, the wrists and inner fingers keep moving on different
    // phases. The hands feel alive without losing their readable silhouette.
    float living = smoothstep(6.72, 6.94, uStage) * (1.0 - exit) * uMotionStrength;
    float reachWave = sin(uTime * 1.06 + mix(0.0, 1.12, rightHand));
    float depthWave = cos(uTime * 0.61 + mix(0.45, 1.86, rightHand));
    float fingerMask = 1.0 - smoothstep(0.32, 1.72, abs(center.x));
    center.x -= side * living * (0.052 + fingerMask * 0.09) * (0.55 + reachWave * 0.45);
    center.y += living * mix(0.034, -0.047, rightHand) * reachWave;
    center.z += living * (0.042 + fingerMask * 0.056) * depthWave;
    center.x -= side * contact * mix(0.075, 0.035, rightHand);
    center.y += contact * mix(0.025, -0.045, rightHand);
    // The post-contact cloud stays compact while the final object starts
    // assembling, so there is no empty beat followed by an instant rebuild.
    vec3 blastDirection = normalize(aRandom + local * 0.065 + vec3(-side * 0.12, -0.04, 0.24));
    center += blastDirection * exit * (0.24 + aSeed * 1.52);
    center.xy += uParallax * center.z * 0.018;

    float spinZ = aSeed * 23.0 + uTime * (0.08 + aSeed * 0.16);
    float spinX = aSeed * 13.0 - uTime * (0.055 + aSeed * 0.1);
    mat3 shardZ = mat3(
      cos(spinZ), -sin(spinZ), 0.0,
      sin(spinZ), cos(spinZ), 0.0,
      0.0, 0.0, 1.0
    );
    mat3 shardX = mat3(
      1.0, 0.0, 0.0,
      0.0, cos(spinX), -sin(spinX),
      0.0, sin(spinX), cos(spinX)
    );

    float size = mix(0.008, 0.023, pow(aSeed, 2.45));
    size *= 1.0 + exit * 0.22;
    vec3 shardVertex = shardX * shardZ * position * size;
    vec3 surfaceNormal = normalize(rotateZ * rotateX * rotateY * aSurfaceNormal);
    vec3 shardNormal = normalize(surfaceNormal * 0.72 + shardX * shardZ * normal * 0.28);
    vec4 viewPosition = modelViewMatrix * vec4(center + shardVertex, 1.0);
    vec3 viewNormal = normalize(normalMatrix * shardNormal);
    float particleDepth = smoothstep(-9.5, -6.8, viewPosition.z);
    gl_Position = projectionMatrix * viewPosition;

    vec3 gold = vec3(0.22, 0.9, 0.84);
    vec3 violet = vec3(0.55, 0.48, 1.0);
    vec3 green = vec3(0.27, 0.94, 0.66);
    vec3 whiteHot = vec3(0.92, 1.0, 0.99);
    float variant = fract(aSeed * 27.71);
    vec3 leftColor = gold;
    if (variant > 0.78) leftColor = violet;
    if (variant > 0.91) leftColor = green;
    if (variant > 0.975) leftColor = whiteHot;
    float surfaceDepth = smoothstep(-0.94, 0.94, center.z);
    float surfaceLight = max(dot(surfaceNormal, normalize(vec3(-0.38, 0.64, 0.72))), 0.0);
    float rimLight = pow(1.0 - abs(surfaceNormal.z), 2.0);
    leftColor = mix(leftColor * 0.18, leftColor * 1.52, surfaceLight * 0.74 + aTone * 0.26);
    vec3 rightColor = mix(vec3(0.035, 0.12, 0.14), whiteHot * 1.18, surfaceLight * 0.72 + aTone * 0.28);
    leftColor += gold * rimLight * 0.2;
    rightColor += vec3(0.34, 0.42, 0.54) * rimLight * 0.34;
    leftColor *= mix(0.74, 1.14, surfaceDepth);
    rightColor *= mix(0.68, 1.18, surfaceDepth);
    vColor = mix(leftColor, rightColor, step(0.0, side));
    float contactGlow = contact * (1.0 - smoothstep(0.04, 0.38, length(center.xy)));
    vColor += whiteHot * contactGlow * 1.8;
    vAlpha = visibleIn * visibleOut * mix(0.72, 1.0, particleDepth) * (1.0 - exit * 0.38);
    vAlpha += contactGlow * 0.5;
    vLocal = position.xy;
    vDepth = particleDepth;
    vGlint = step(0.968, fract(aSeed * 41.17)) * particleDepth;
    vFacetLight = 0.38 + max(dot(viewNormal, normalize(vec3(-0.4, 0.68, 0.72))), 0.0) * 1.02;
  }
`;

function mulberry32(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function makeEnergyGenerator(count: number, random: () => number) {
  const data = new Float32Array(count * 3);
  const centerX = 0.18;
  const centerY = 0;
  const TAU = Math.PI * 2;
  const leftX = -4.75;
  const rightX = 4.15;

  for (let i = 0; i < count; i += 1) {
    const kind = random();
    let x = 0;
    let y = 0;
    let z = 0;

    // The outer vortex wall. These samples are advected along X in the shader,
    // so the silhouette remains cylindrical while every shard keeps moving.
    if (kind < 0.53) {
      const progress = random();
      const angle = TAU * (random() + progress * 1.25);
      const radius = 1.19 + random() * 0.37 + (random() - 0.5) * 0.11;
      x = THREE.MathUtils.lerp(leftX, rightX, progress);
      y = Math.cos(angle) * radius * 0.84;
      z = Math.sin(angle) * radius;
    // A dense inner filament produces the bright moving current seen through
    // the cylinder rather than leaving an empty black centre.
    } else if (kind < 0.72) {
      const progress = random();
      const angle = TAU * (random() + progress * 1.8);
      const radius = Math.pow(random(), 2.25) * 0.78 + 0.025;
      x = THREE.MathUtils.lerp(leftX, rightX, progress);
      y = Math.cos(angle) * radius * 0.72;
      z = Math.sin(angle) * radius;
    // The left aperture is an elliptical particle ring, tilted toward camera.
    } else if (kind < 0.845) {
      const angle = random() * TAU;
      const radius = 1.55 + (random() - 0.5) * 0.25;
      x = leftX - Math.sin(angle) * radius * 0.36;
      y = Math.cos(angle) * radius * 0.86;
      z = Math.sin(angle) * radius;
    // The opposite aperture rotates in the other direction.
    } else if (kind < 0.97) {
      const angle = random() * TAU;
      const radius = 1.55 + (random() - 0.5) * 0.25;
      x = rightX - Math.sin(angle) * radius * 0.36;
      y = Math.cos(angle) * radius * 0.86;
      z = Math.sin(angle) * radius;
    // Sparse sparks soften both openings and keep the full-screen scale.
    } else {
      const side = random() < 0.5 ? leftX : rightX;
      const angle = random() * TAU;
      const spread = 1.58 + random() * 0.72;
      x = side + (random() - 0.5) * 0.7;
      y = Math.cos(angle) * spread * 0.82;
      z = Math.sin(angle) * spread;
    }

    data[i * 3] = centerX + x;
    data[i * 3 + 1] = centerY + y;
    data[i * 3 + 2] = z;
  }

  return data;
}

function makeCloud(count: number, random: () => number, spread = 1) {
  const data = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const edgeBias = Math.pow(random(), 0.72);
    data[i * 3] = (random() - 0.5) * 10.8 * spread * edgeBias;
    data[i * 3 + 1] = (random() - 0.5) * 6.5 * spread;
    data[i * 3 + 2] = (random() - 0.5) * 3.4;
  }
  return data;
}

function makeBulb(count: number, random: () => number) {
  const data = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const angle = random() * Math.PI * 2;
    const shell = random() > 0.28;
    const fill = shell ? 0.86 + random() * 0.15 : Math.sqrt(random()) * 0.84;
    const anatomicalLean = 0.12;
    const rawX = 16 * Math.pow(Math.sin(angle), 3);
    const rawY =
      13 * Math.cos(angle) -
      5 * Math.cos(2 * angle) -
      2 * Math.cos(3 * angle) -
      Math.cos(4 * angle);
    let x = rawX * 0.066 * fill;
    let y = rawY * 0.071 * fill;
    x += y * anatomicalLean;
    y += 0.12;

    if (random() > 0.9) {
      const vessel = random() < 0.5 ? -1 : 1;
      const progress = random();
      x = vessel * (0.18 + progress * 0.24) + (random() - 0.5) * 0.08;
      y = 0.72 + progress * 0.76 + (random() - 0.5) * 0.08;
    }

    data[i * 3] = -1.85 + x;
    data[i * 3 + 1] = 0.05 + y;
    const heartRadius = Math.min(1, Math.sqrt(x * x + (y - 0.12) ** 2) / 1.18);
    const heartDepth = 0.22 + 0.88 * Math.sqrt(Math.max(0.05, 1 - heartRadius * heartRadius));
    data[i * 3 + 2] = (random() - 0.5) * heartDepth;
  }
  return data;
}

function makeTurbine(count: number, random: () => number) {
  const data = new Float32Array(count * 3);
  const center = { x: 2.08, y: 0, z: 0.12 };
  for (let i = 0; i < count; i += 1) {
    const kind = random();
    const y = (random() - 0.5) * 4.8;
    const phase = y * 1.56;
    let x: number;
    let z: number;

    if (kind < 0.64) {
      const strand = kind < 0.32 ? 0 : Math.PI;
      x = Math.sin(phase + strand) * 0.78 + (random() - 0.5) * 0.1;
      z = Math.cos(phase + strand) * 0.92 + (random() - 0.5) * 0.12;
    } else if (kind < 0.87) {
      const progress = random();
      const fromX = Math.sin(phase) * 0.78;
      const fromZ = Math.cos(phase) * 0.92;
      x = THREE.MathUtils.lerp(fromX, -fromX, progress) + (random() - 0.5) * 0.07;
      z = THREE.MathUtils.lerp(fromZ, -fromZ, progress) + (random() - 0.5) * 0.08;
    } else {
      const halo = random() * Math.PI * 2;
      const radius = 1.05 + random() * 1.55;
      x = Math.cos(halo) * radius + (random() - 0.5) * 0.22;
      z = Math.sin(halo) * radius * 0.72 + (random() - 0.5) * 0.22;
    }

    data[i * 3] = center.x + x;
    data[i * 3 + 1] = center.y + y;
    data[i * 3 + 2] = center.z + z;
  }
  return data;
}

function makeAtom(count: number, random: () => number) {
  const data = new Float32Array(count * 3);
  const cells = [
    { x: -2.48, y: 0, z: 0, scale: 1.02 },
    { x: -0.9, y: 1.27, z: -0.42, scale: 0.59 },
    { x: -0.78, y: -1.27, z: 0.38, scale: 0.61 },
  ];
  for (let i = 0; i < count; i += 1) {
    const groupRoll = random();
    const cell = cells[groupRoll < 0.62 ? 0 : groupRoll < 0.82 ? 1 : 2];
    const cellScale = cell.scale;
    const kind = random();
    let x = 0;
    let y = 0;
    let z = 0;

    if (kind < 0.22) {
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      const radius = Math.cbrt(random()) * 0.36 * cellScale;
      x = Math.cos(theta) * Math.sin(phi) * radius;
      y = Math.cos(phi) * radius;
      z = Math.sin(theta) * Math.sin(phi) * radius;
    } else {
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      const membrane = kind > 0.9 ? 1.16 + (random() - 0.5) * 0.17 : 1 + (random() - 0.5) * 0.055;
      x = Math.cos(theta) * Math.sin(phi) * 1.45 * membrane * cellScale;
      y = Math.cos(phi) * 1.18 * membrane * cellScale;
      z = Math.sin(theta) * Math.sin(phi) * 0.9 * membrane * cellScale;
    }

    data[i * 3] = cell.x + x;
    data[i * 3 + 1] = cell.y + y;
    data[i * 3 + 2] = cell.z + z;
  }
  return data;
}

function makeHands(count: number, random: () => number) {
  const data = new Float32Array(count * 3);
  type Vec3 = [number, number, number];
  type CapsulePart = {
    kind: "capsule";
    from: Vec3;
    to: Vec3;
    radiusFrom: number;
    radiusTo: number;
    weight: number;
  };
  type EllipsoidPart = {
    kind: "ellipsoid";
    center: Vec3;
    radii: Vec3;
    rotation: Vec3;
    weight: number;
  };
  type HandPart = CapsulePart | EllipsoidPart;

  const length = (vector: Vec3) => Math.hypot(vector[0], vector[1], vector[2]);
  const normalize = (vector: Vec3): Vec3 => {
    const magnitude = Math.max(length(vector), 0.00001);
    return [vector[0] / magnitude, vector[1] / magnitude, vector[2] / magnitude];
  };
  const cross = (a: Vec3, b: Vec3): Vec3 => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const transformPoint = (point: Vec3, side: -1 | 1): Vec3 => [
    point[0] * side,
    point[1] + (side === 1 ? 0.065 : 0),
    point[2] * -side,
  ];

  const createHand = (side: -1 | 1) => {
    const parts: HandPart[] = [];
    const addCapsule = (from: Vec3, to: Vec3, radiusFrom: number, radiusTo: number, weightBoost = 1) => {
      const start = transformPoint(from, side);
      const end = transformPoint(to, side);
      const segmentLength = length([end[0] - start[0], end[1] - start[1], end[2] - start[2]]);
      parts.push({
        kind: "capsule",
        from: start,
        to: end,
        radiusFrom,
        radiusTo,
        weight: segmentLength * (radiusFrom + radiusTo) * 16 * weightBoost,
      });
    };
    const addEllipsoid = (center: Vec3, radii: Vec3, rotation: Vec3, weightBoost = 1) => {
      parts.push({
        kind: "ellipsoid",
        center: transformPoint(center, side),
        radii,
        rotation: [rotation[0] * -side, rotation[1] * side, rotation[2] * side],
        weight: (radii[0] * radii[1] + radii[1] * radii[2] + radii[0] * radii[2]) * 11 * weightBoost,
      });
    };
    const addFinger = (joints: Vec3[], radii: number[], weightBoost = 1) => {
      for (let index = 0; index < joints.length - 1; index += 1) {
        addCapsule(joints[index], joints[index + 1], radii[index], radii[index + 1], weightBoost);
        if (index > 0) {
          addEllipsoid(joints[index], [radii[index] * 1.12, radii[index] * 1.05, radii[index] * 1.08], [0, 0, 0], 0.35);
        }
      }
    };

    // Forearm, wrist and palm are three truly volumetric masses, not an extruded mask.
    addCapsule([-6.45, -0.18, -0.12], [-4.18, 0.27, -0.02], 0.82, 0.57, 0.36);
    addCapsule([-4.3, 0.25, -0.02], [-3.55, 0.39, 0.02], 0.59, 0.61, 0.46);
    addEllipsoid([-3.08, 0.36, 0.04], [1.08, 0.68, 0.44], [0.04, -0.11, 0.02], 2.35);
    addEllipsoid([-2.82, 0.43, 0.08], [0.78, 0.49, 0.39], [0.02, -0.16, 0.04], 1.52);

    // Articulated phalanges give every finger its own bend, taper and depth plane.
    addFinger([
      [-2.55, 0.69, 0.12], [-1.78, 0.63, 0.16], [-0.96, 0.51, 0.13], [-0.16, 0.35, 0.07],
    ], [0.235, 0.205, 0.165, 0.105], 4.8);
    addFinger([
      [-2.54, 0.45, 0.0], [-1.89, 0.2, 0.02], [-1.47, -0.16, 0.09], [-1.54, -0.52, 0.17],
    ], [0.235, 0.205, 0.16, 0.105], 3.75);
    addFinger([
      [-2.7, 0.2, -0.13], [-2.12, -0.17, -0.13], [-1.79, -0.53, -0.07], [-1.94, -0.84, 0.01],
    ], [0.22, 0.19, 0.145, 0.095], 3.45);
    addFinger([
      [-2.92, 0.0, -0.23], [-2.49, -0.37, -0.25], [-2.3, -0.69, -0.17], [-2.49, -0.93, -0.07],
    ], [0.19, 0.16, 0.125, 0.082], 3.1);
    addFinger([
      [-3.43, 0.03, 0.28], [-2.92, -0.42, 0.36], [-2.38, -0.67, 0.3],
    ], [0.255, 0.205, 0.125], 4.05);

    let totalWeight = 0;
    const weighted = parts.map((part) => {
      totalWeight += part.weight;
      return { part, totalWeight };
    });
    return { weighted, totalWeight };
  };

  const hands = [createHand(-1), createHand(1)];
  const samplePart = (part: HandPart): Vec3 => {
    if (part.kind === "capsule") {
      const axis: Vec3 = [
        part.to[0] - part.from[0],
        part.to[1] - part.from[1],
        part.to[2] - part.from[2],
      ];
      const normal = normalize(axis);
      const reference: Vec3 = Math.abs(normal[2]) < 0.82 ? [0, 0, 1] : [0, 1, 0];
      const tangent = normalize(cross(normal, reference));
      const bitangent = normalize(cross(normal, tangent));
      const progress = random();
      const angle = random() * Math.PI * 2;
      const radius = part.radiusFrom + (part.radiusTo - part.radiusFrom) * progress;
      const roundness = Math.sin(Math.PI * Math.min(1, Math.max(0, progress))) * 0.08 + 0.96;
      const radial = radius * roundness;
      return [
        part.from[0] + axis[0] * progress + (tangent[0] * Math.cos(angle) + bitangent[0] * Math.sin(angle)) * radial,
        part.from[1] + axis[1] * progress + (tangent[1] * Math.cos(angle) + bitangent[1] * Math.sin(angle)) * radial,
        part.from[2] + axis[2] * progress + (tangent[2] * Math.cos(angle) + bitangent[2] * Math.sin(angle)) * radial,
      ];
    }

    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    let x = Math.cos(theta) * Math.sin(phi) * part.radii[0];
    let y = Math.cos(phi) * part.radii[1];
    let z = Math.sin(theta) * Math.sin(phi) * part.radii[2];
    const cosX = Math.cos(part.rotation[0]);
    const sinX = Math.sin(part.rotation[0]);
    const cosY = Math.cos(part.rotation[1]);
    const sinY = Math.sin(part.rotation[1]);
    const cosZ = Math.cos(part.rotation[2]);
    const sinZ = Math.sin(part.rotation[2]);
    const rotatedY = y * cosX - z * sinX;
    const rotatedZ = y * sinX + z * cosX;
    const rotatedX = x * cosY + rotatedZ * sinY;
    z = -x * sinY + rotatedZ * cosY;
    x = rotatedX * cosZ - rotatedY * sinZ;
    y = rotatedX * sinZ + rotatedY * cosZ;
    return [part.center[0] + x, part.center[1] + y, part.center[2] + z];
  };

  for (let i = 0; i < count; i += 1) {
    const hand = hands[i % 2];
    const target = random() * hand.totalWeight;
    let low = 0;
    let high = hand.weighted.length - 1;
    while (low < high) {
      const middle = (low + high) >> 1;
      if (target < hand.weighted[middle].totalWeight) high = middle;
      else low = middle + 1;
    }
    const point = samplePart(hand.weighted[low].part);
    data[i * 3] = point[0];
    data[i * 3 + 1] = point[1];
    data[i * 3 + 2] = point[2] * 1.55;
  }

  return data;
}

function makeEnergyHub(count: number, random: () => number) {
  const data = new Float32Array(count * 3);
  const bolts = [
    { x: -2.42, y: 0.05, height: 3.35, width: 1.08, rotation: -0.22, weight: 0.22 },
    { x: -4.25, y: 1.42, height: 1.92, width: 0.62, rotation: 0.88, weight: 0.1 },
    { x: -4.08, y: -1.38, height: 1.76, width: 0.56, rotation: -1.02, weight: 0.09 },
    { x: -1.04, y: 1.63, height: 1.86, width: 0.62, rotation: -0.78, weight: 0.1 },
    { x: -0.86, y: -1.48, height: 1.96, width: 0.66, rotation: 0.94, weight: 0.1 },
    { x: 0.06, y: 0.68, height: 1.48, width: 0.5, rotation: -0.52, weight: 0.08 },
    { x: -3.02, y: 1.94, height: 1.54, width: 0.5, rotation: 1.17, weight: 0.08 },
    { x: -2.08, y: -1.86, height: 1.62, width: 0.52, rotation: 0.46, weight: 0.08 },
    { x: -4.72, y: 0.05, height: 1.42, width: 0.48, rotation: -0.12, weight: 0.07 },
    { x: -1.62, y: 0.64, height: 1.24, width: 0.44, rotation: -1.28, weight: 0.08 },
  ];
  const cumulativeWeights: number[] = [];
  let weightTotal = 0;
  for (const bolt of bolts) {
    weightTotal += bolt.weight;
    cumulativeWeights.push(weightTotal);
  }
  const offsets = [0.08, 0.34, -0.26, 0.38, -0.2, 0.25, -0.02];

  for (let i = 0; i < count; i += 1) {
    const selector = random() * weightTotal;
    let boltIndex = cumulativeWeights.findIndex((weight) => selector <= weight);
    if (boltIndex < 0) boltIndex = bolts.length - 1;
    const bolt = bolts[boltIndex];
    const progress = random();
    const scaled = progress * (offsets.length - 1);
    const segment = Math.min(offsets.length - 2, Math.floor(scaled));
    const localProgress = scaled - segment;
    const centreLine = THREE.MathUtils.lerp(
      offsets[segment],
      offsets[segment + 1],
      localProgress,
    );
    const thickness = (random() - 0.5) * (0.13 + random() * 0.2);
    const localX = (centreLine + thickness) * bolt.width;
    const localY = (0.5 - progress) * bolt.height;
    const cos = Math.cos(bolt.rotation);
    const sin = Math.sin(bolt.rotation);
    let x = bolt.x + localX * cos - localY * sin;
    let y = bolt.y + localX * sin + localY * cos;
    let z = (random() - 0.5) * (0.42 + (1 - Math.abs(progress - 0.5) * 2) * 0.32);

    // A small halo of fragments around every bolt avoids hard diagram-like
    // silhouettes and keeps the final field alive between the main strikes.
    if (random() > 0.84) {
      const spark = 0.18 + random() * 0.44;
      x += (random() - 0.5) * spark;
      y += (random() - 0.5) * spark * 1.35;
      z += (random() - 0.5) * 0.48;
    }

    data[i * 3] = x;
    data[i * 3 + 1] = y;
    data[i * 3 + 2] = z;
  }
  return data;
}

function makeAmbient(count: number, random: () => number) {
  const data = makeCloud(count, random, 1.05);
  for (let i = 0; i < count; i += 1) {
    const centralSignal = random() < 0.29;
    if (centralSignal) {
      const y = (random() - 0.5) * 3.9;
      const helixPart = random();
      const phase = y * 1.35;
      if (helixPart < 0.76) {
        const strandPhase = phase + (helixPart < 0.38 ? 0 : Math.PI);
        data[i * 3] = Math.sin(strandPhase) * 0.52 + (random() - 0.5) * 0.13;
        data[i * 3 + 2] = Math.cos(strandPhase) * 0.72 + (random() - 0.5) * 0.18;
      } else {
        const rungProgress = random();
        const fromX = Math.sin(phase) * 0.52;
        const fromZ = Math.cos(phase) * 0.72;
        data[i * 3] = THREE.MathUtils.lerp(fromX, -fromX, rungProgress) + (random() - 0.5) * 0.08;
        data[i * 3 + 2] = THREE.MathUtils.lerp(fromZ, -fromZ, rungProgress) + (random() - 0.5) * 0.08;
      }
      data[i * 3 + 1] = y;
      continue;
    }
    const quietCenter = Math.abs(data[i * 3]) < 1.35 && Math.abs(data[i * 3 + 1]) < 1.55;
    if (quietCenter) {
      data[i * 3] += data[i * 3] > 0 ? 1.15 : -1.15;
    }
    data[i * 3 + 2] *= 0.55;
  }
  return data;
}

function makeInvestors(count: number, random: () => number) {
  const data = new Float32Array(count * 3);
  const core = [-1.65, 0.02, 0];
  const TAU = Math.PI * 2;

  for (let i = 0; i < count; i += 1) {
    const kind = random();
    const angle = random() * TAU;
    let x: number;
    let y: number;
    let z: number;

    if (kind < 0.68) {
      // The primary axis is made only from particles: no CSS line, planet dot
      // or separate glowing sphere can break the visual language.
      const ribbon = (random() - 0.5) * 0.17;
      const depthBand = (random() - 0.5) * 0.2;
      x = core[0] + Math.cos(angle) * (3.2 + ribbon);
      y = core[1] + Math.sin(angle) * (1.3 + ribbon * 0.4);
      z = Math.sin(angle - 0.35) * 0.62 + depthBand;
    } else {
      // Background stars fill the left visual field and resolve into the same
      // orbital axis as the section settles.
      const starAngle = random() * TAU;
      const radius = 0.9 + Math.pow(random(), 0.62) * 3.35;
      x = core[0] + Math.cos(starAngle) * radius * (0.86 + random() * 0.24);
      y = core[1] + Math.sin(starAngle) * radius * 0.46 + (random() - 0.5) * 0.34;
      z = (random() - 0.5) * 2.65 + Math.sin(starAngle * 1.5) * 0.24;
    }

    data[i * 3] = x;
    data[i * 3 + 1] = y;
    data[i * 3 + 2] = z;
  }
  return data;
}

function makeTargets(count: number): TargetSet {
  const random = mulberry32(20260720);
  return [
    makeEnergyGenerator(count, random),
    makeCloud(count, random),
    makeBulb(count, random),
    makeTurbine(count, random),
    makeAtom(count, random),
    makeAmbient(count, random),
    makeInvestors(count, random),
    makeHands(count, random),
    makeEnergyHub(count, random),
  ];
}

export default function WebGLMorphScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    gsap.registerPlugin(ScrollTrigger);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.innerWidth < 760;
    const lowCoreDevice = typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 4;
    const count = reducedMotion ? 2200 : mobile ? 3900 : lowCoreDevice ? 5600 : 8600;
    const targets = makeTargets(count);
    const formCenters = [
      new THREE.Vector3(0.18, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-1.85, 0.05, 0),
      new THREE.Vector3(1.78, 0, 0),
      new THREE.Vector3(-1.72, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-1.62, 0.08, 0),
      new THREE.Vector3(0, 0.04, 0),
      new THREE.Vector3(-2, 0, 0),
    ];
    const volumeStrengths = [1, 0, 0.82, 0.55, 0.25, 0, 0.48, 0.34, 0.42];
    const random = mulberry32(7719);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 40);
    camera.position.z = 8.2;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x031011, 0);

    const shardSource = new THREE.TetrahedronGeometry(0.72, 0);
    const seeds = new Float32Array(count);
    const randomVectors = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      seeds[i] = random();
      randomVectors[i * 3] = random() - 0.5;
      randomVectors[i * 3 + 1] = random() - 0.5;
      randomVectors[i * 3 + 2] = random() - 0.5;
    }

    const geometry = new THREE.InstancedBufferGeometry();
    geometry.setAttribute("position", shardSource.getAttribute("position").clone());
    geometry.setAttribute("normal", shardSource.getAttribute("normal").clone());
    if (shardSource.index) geometry.setIndex(shardSource.index.clone());
    shardSource.dispose();
    geometry.setAttribute("aFrom", new THREE.InstancedBufferAttribute(targets[0], 3));
    geometry.setAttribute("aTo", new THREE.InstancedBufferAttribute(targets[1], 3));
    geometry.setAttribute("aRandom", new THREE.InstancedBufferAttribute(randomVectors, 3));
    geometry.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 1));
    geometry.instanceCount = count;

    const uniforms = {
      uTime: { value: 0 },
      uMorph: { value: 0 },
      uScatter: { value: reducedMotion ? 0.01 : 0.105 },
      uMouseForce: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uViewportAspect: { value: window.innerWidth / Math.max(window.innerHeight, 1) },
      uStage: { value: 0 },
      uScrollPhase: { value: 0 },
      uFloatStrength: { value: reducedMotion ? 0.12 : 1 },
      uVolumeStrength: { value: 1 },
      uMotionStrength: { value: reducedMotion ? 0 : 1 },
      uMouse: { value: new THREE.Vector2(99, 99) },
      uParallax: { value: new THREE.Vector2(0, 0) },
      uFormCenter: { value: formCenters[0].clone() },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const particles = new THREE.Mesh(geometry, material);
    particles.frustumCulled = false;
    scene.add(particles);

    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-particle-shape]"));
    let anchors: number[] = [];
    let stage = -1;
    let mouseVelocity = 0;
    let pointerActive = false;
    let lastPointerX = window.innerWidth / 2;
    let lastPointerY = window.innerHeight / 2;
    const parallaxTarget = new THREE.Vector2(0, 0);
    let scrollRotationY = 0;
    let scrollRotationZ = 0;
    let targetGlobalProgress = 0;
    let renderedGlobalProgress = 0;
    let disposed = false;

    // The hand scene has its own, denser particle system. Its silhouette is sampled
    // from the supplied reference video, while depth is reconstructed procedurally
    // from the distance to the silhouette edge. This keeps the source frame out of
    // the page and gives the particles real Z volume during the entrance turn.
    let handGeometry: THREE.InstancedBufferGeometry | null = null;
    let handMaterial: THREE.ShaderMaterial | null = null;
    let handParticles: THREE.Mesh | null = null;
    const handImage = new Image();
    handImage.decoding = "async";
    handImage.onload = () => {
      if (disposed) return;

      const sampleCanvas = document.createElement("canvas");
      sampleCanvas.width = handImage.naturalWidth;
      sampleCanvas.height = handImage.naturalHeight;
      const context = sampleCanvas.getContext("2d", { willReadFrequently: true });
      if (!context) return;
      context.drawImage(handImage, 0, 0);
      const source = context.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height);
      const { width, height } = sampleCanvas;
      const threshold = 24;
      const candidates: Array<[number, number, number]> = [];
      let minX = width;
      let maxX = 0;
      let minY = height;
      let maxY = 0;

      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const offset = (y * width + x) * 4;
          const luminance =
            source.data[offset] * 0.2126 +
            source.data[offset + 1] * 0.7152 +
            source.data[offset + 2] * 0.0722;
          if (luminance <= threshold) continue;
          candidates.push([x, y, luminance]);
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
      if (!candidates.length) return;

      const handCount = reducedMotion ? 4200 : mobile ? 8800 : lowCoreDevice ? 12800 : 21000;
      const handPositions = new Float32Array(handCount * 3);
      const handSeeds = new Float32Array(handCount);
      const handRandomVectors = new Float32Array(handCount * 3);
      const handSurfaceNormals = new Float32Array(handCount * 3);
      const handTones = new Float32Array(handCount);
      const handRandom = mulberry32(99173);
      const centerX = (minX + maxX) * 0.5;
      const centerY = (minY + maxY) * 0.5;
      const spanX = Math.max(1, maxX - minX);
      const spanY = Math.max(1, maxY - minY);

      const brightnessAt = (x: number, y: number) => {
        if (x < 0 || y < 0 || x >= width || y >= height) return 0;
        const offset = (y * width + x) * 4;
        return (
          source.data[offset] * 0.2126 +
          source.data[offset + 1] * 0.7152 +
          source.data[offset + 2] * 0.0722
        );
      };

      for (let i = 0; i < handCount; i += 1) {
        const [pixelX, pixelY, luminance] =
          candidates[Math.floor(handRandom() * candidates.length)];
        let edgeRadius = 1;
        for (; edgeRadius < 16; edgeRadius += 1) {
          if (
            brightnessAt(pixelX - edgeRadius, pixelY) <= threshold ||
            brightnessAt(pixelX + edgeRadius, pixelY) <= threshold ||
            brightnessAt(pixelX, pixelY - edgeRadius) <= threshold ||
            brightnessAt(pixelX, pixelY + edgeRadius) <= threshold
          ) {
            break;
          }
        }

        const surface = luminance / 255;
        const depth = Math.min(0.92, 0.1 + edgeRadius * 0.055 + surface * 0.18);
        const frontBack = handRandom() > 0.46 ? 1 : -1;
        const jitter = 0.012;
        handPositions[i * 3] =
          ((pixelX - centerX) / spanX) * 9.25 + (handRandom() - 0.5) * jitter;
        handPositions[i * 3 + 1] =
          ((centerY - pixelY) / spanY) * 4.44 + (handRandom() - 0.5) * jitter;
        // Sample a front/back shell instead of filling a flat random slab.
        // Together with the edge-derived thickness this creates real palms,
        // knuckles and finger volume when the pose turns toward the camera.
        handPositions[i * 3 + 2] =
          frontBack * depth * (0.76 + handRandom() * 0.2) + (handRandom() - 0.5) * 0.035;
        handSeeds[i] = handRandom();
        handRandomVectors[i * 3] = handRandom() - 0.5;
        handRandomVectors[i * 3 + 1] = handRandom() - 0.5;
        handRandomVectors[i * 3 + 2] = handRandom() - 0.5;

        const gradientX =
          (brightnessAt(pixelX - 2, pixelY) - brightnessAt(pixelX + 2, pixelY)) / 255;
        const gradientY =
          (brightnessAt(pixelX, pixelY + 2) - brightnessAt(pixelX, pixelY - 2)) / 255;
        const normalLength = Math.hypot(gradientX * 1.7, gradientY * 1.7, 1);
        handSurfaceNormals[i * 3] = (gradientX * 1.7) / normalLength;
        handSurfaceNormals[i * 3 + 1] = (gradientY * 1.7) / normalLength;
        handSurfaceNormals[i * 3 + 2] = frontBack / normalLength;
        handTones[i] = surface;
      }

      const handShard = new THREE.TetrahedronGeometry(0.72, 0);
      handGeometry = new THREE.InstancedBufferGeometry();
      handGeometry.setAttribute("position", handShard.getAttribute("position").clone());
      handGeometry.setAttribute("normal", handShard.getAttribute("normal").clone());
      if (handShard.index) handGeometry.setIndex(handShard.index.clone());
      handShard.dispose();
      handGeometry.setAttribute(
        "aPosition",
        new THREE.InstancedBufferAttribute(handPositions, 3),
      );
      handGeometry.setAttribute(
        "aRandom",
        new THREE.InstancedBufferAttribute(handRandomVectors, 3),
      );
      handGeometry.setAttribute(
        "aSurfaceNormal",
        new THREE.InstancedBufferAttribute(handSurfaceNormals, 3),
      );
      handGeometry.setAttribute("aSeed", new THREE.InstancedBufferAttribute(handSeeds, 1));
      handGeometry.setAttribute("aTone", new THREE.InstancedBufferAttribute(handTones, 1));
      handGeometry.instanceCount = handCount;

      handMaterial = new THREE.ShaderMaterial({
        vertexShader: HAND_VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        uniforms: {
          uTime: uniforms.uTime,
          uStage: uniforms.uStage,
          uMotionStrength: uniforms.uMotionStrength,
          uParallax: uniforms.uParallax,
        },
        transparent: true,
        depthWrite: true,
        depthTest: true,
        blending: THREE.NormalBlending,
        side: THREE.DoubleSide,
      });
      handParticles = new THREE.Mesh(handGeometry, handMaterial);
      handParticles.frustumCulled = false;
      handParticles.visible = false;
      // Wide screens get the full cinematic span from edge to edge. Narrow
      // layouts reduce only the horizontal scale so the wrists stay readable.
      const initialHandAspect = window.innerWidth / Math.max(window.innerHeight, 1);
      const initialHandScaleX = THREE.MathUtils.clamp(
        initialHandAspect * 0.68 - 0.056,
        0.78,
        1.25,
      );
      handParticles.scale.set(initialHandScaleX, 1.04, 1);
      scene.add(handParticles);
    };
    handImage.src = "/assets/hands-reference.png";

    const setStage = (nextStage: number) => {
      const safeStage = Math.max(0, Math.min(nextStage, targets.length - 2));
      if (safeStage === stage) return;
      stage = safeStage;
      geometry.setAttribute("aFrom", new THREE.InstancedBufferAttribute(targets[safeStage], 3));
      geometry.setAttribute("aTo", new THREE.InstancedBufferAttribute(targets[safeStage + 1], 3));
      geometry.attributes.aFrom.needsUpdate = true;
      geometry.attributes.aTo.needsUpdate = true;
    };

    const recalculate = () => {
      camera.aspect = window.innerWidth / Math.max(window.innerHeight, 1);
      uniforms.uViewportAspect.value = camera.aspect;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.2 : 1.45));
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      if (handParticles) {
        const handScaleX = THREE.MathUtils.clamp(
          camera.aspect * 0.68 - 0.056,
          0.78,
          1.25,
        );
        handParticles.scale.set(handScaleX, 1.04, 1);
      }
      anchors = sections.map((section) => section.offsetTop + section.offsetHeight * 0.5);
    };

    const updateScroll = () => {
      if (anchors.length < 2) return;
      const focus = window.scrollY + window.innerHeight * 0.48;
      let nextStage = 0;
      for (let i = 0; i < anchors.length - 1; i += 1) {
        if (focus >= anchors[i]) nextStage = i;
      }
      nextStage = Math.min(nextStage, targets.length - 2);
      const from = anchors[nextStage];
      const to = anchors[Math.min(nextStage + 1, anchors.length - 1)];
      const raw = to === from ? 0 : (focus - from) / (to - from);
      const linearMorph = Math.max(0, Math.min(raw, 1));
      targetGlobalProgress = nextStage + linearMorph;
      if (reducedMotion) renderedGlobalProgress = targetGlobalProgress;
      uniforms.uScrollPhase.value = window.scrollY * 0.0022;

      const heroOrbit = nextStage === 0 ? 1 : 0.45;
      // Scroll now nudges the camera-facing angle in a bounded range.
      scrollRotationY = Math.sin(window.scrollY * 0.0003) * 0.075 * heroOrbit;
      scrollRotationZ = Math.sin(window.scrollY * 0.00022) * 0.018;
    };

    const onPointerMove = (event: PointerEvent) => {
      const dx = event.clientX - lastPointerX;
      const dy = event.clientY - lastPointerY;
      mouseVelocity = Math.min(0.66, mouseVelocity + Math.sqrt(dx * dx + dy * dy) * 0.0065);
      pointerActive = true;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;

      const ndcX = (event.clientX / window.innerWidth) * 2 - 1;
      const ndcY = -(event.clientY / window.innerHeight) * 2 + 1;
      parallaxTarget.set(ndcX, ndcY);
      const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * camera.position.z;
      uniforms.uMouse.value.set(ndcX * visibleHeight * camera.aspect * 0.5, ndcY * visibleHeight * 0.5);
    };

    const onPointerLeave = () => {
      pointerActive = false;
      parallaxTarget.set(0, 0);
      uniforms.uMouse.value.set(99, 99);
    };
    const onResize = () => {
      recalculate();
      ScrollTrigger.refresh();
      updateScroll();
    };

    const gsapContext = gsap.context(() => {
      document.querySelectorAll<HTMLElement>(".reveal").forEach((element) => {
        gsap.fromTo(
          element,
          { autoAlpha: 0, y: 64 },
          {
            autoAlpha: 1,
            y: 0,
            ease: "none",
            scrollTrigger: {
              trigger: element,
              start: "top 91%",
              end: "top 62%",
              scrub: reducedMotion ? false : 0.8,
              once: reducedMotion,
            },
          },
        );
      });

    });

    recalculate();
    updateScroll();
    window.addEventListener("resize", onResize);
    let scrollFrame = 0;
    const onScroll = () => {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0;
        updateScroll();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);

    const startedAt = performance.now();
    let previousFrameAt = startedAt;
    let frame = 0;
    const render = () => {
      if (disposed) return;
      const now = performance.now();
      const elapsed = (now - startedAt) / 1000;
      const delta = Math.min((now - previousFrameAt) / 1000, 0.05);
      previousFrameAt = now;
      // A slower critically stable chase gives both wheel and trackpad input a
      // continuous glide while preserving exact section landing points.
      const progressEase = reducedMotion ? 1 : 1 - Math.exp(-delta * 2.35);
      renderedGlobalProgress += (targetGlobalProgress - renderedGlobalProgress) * progressEase;
      if (Math.abs(targetGlobalProgress - renderedGlobalProgress) < 0.0001) {
        renderedGlobalProgress = targetGlobalProgress;
      }
      const renderedStage = Math.min(
        Math.floor(renderedGlobalProgress),
        targets.length - 2,
      );
      const renderedMorph = Math.max(0, Math.min(renderedGlobalProgress - renderedStage, 1));
      setStage(renderedStage);
      uniforms.uMorph.value = renderedMorph;
      uniforms.uStage.value = renderedStage + renderedMorph;
      uniforms.uFormCenter.value.lerpVectors(
        formCenters[renderedStage],
        formCenters[renderedStage + 1],
        renderedMorph,
      );
      uniforms.uVolumeStrength.value = THREE.MathUtils.lerp(
        volumeStrengths[renderedStage],
        volumeStrengths[renderedStage + 1],
        renderedMorph,
      );
      uniforms.uTime.value = elapsed;
      const pointerTarget = pointerActive ? 0.12 + mouseVelocity : 0;
      uniforms.uMouseForce.value += (pointerTarget - uniforms.uMouseForce.value) * 0.14;
      uniforms.uParallax.value.lerp(parallaxTarget, 0.035);
      mouseVelocity *= 0.89;
      const dimensionalMotion = reducedMotion ? 0 : 1;
      particles.rotation.y = scrollRotationY + Math.sin(elapsed * 0.12) * 0.055 * dimensionalMotion;
      particles.rotation.x = Math.sin(elapsed * 0.09 + 0.8) * 0.025 * dimensionalMotion;
      particles.rotation.z = scrollRotationZ + Math.sin(elapsed * 0.07) * 0.008 * dimensionalMotion;
      if (handParticles) {
        handParticles.visible = uniforms.uStage.value > 5.9 && uniforms.uStage.value < 7.76;
        handParticles.rotation.y = Math.sin(elapsed * 0.15) * 0.012 * dimensionalMotion;
      }
      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(render);
    };
    render();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(scrollFrame);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      gsapContext.revert();
      handImage.onload = null;
      if (handParticles) scene.remove(handParticles);
      handGeometry?.dispose();
      handMaterial?.dispose();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="webgl-canvas" aria-hidden="true" />;
}
