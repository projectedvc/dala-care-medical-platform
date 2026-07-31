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
    // The clinician DNA now morphs directly into the large liver target.
    // Do not force this medical transition through the old orbital bridge.
    float orbitSegment = 0.0;
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
    vec3 bulbSource = aFrom - vec3(-2.25, 0.02, 0.0);
    vec3 bulbBlastDirection = normalize(bulbSource + aRandom * 0.18 + vec3(0.0, 0.08, 0.12));
    center += bulbBlastDirection * bulbDeparture * pathArc * (0.12 + aSeed * 0.34);

    // Do not split the investor rings into two rigid columns. The generic arc
    // now carries every shard continuously into its hand target; the hand pose
    // below supplies the cinematic left/right arrival and 3D turn.

    float turbineStage = smoothstep(2.68, 2.96, uStage) * (1.0 - smoothstep(3.2, 3.58, uStage));
    vec3 turbineCenter = vec3(2.15, 0.0, 0.0);
    float turbineRadius = length(center - turbineCenter);
    // The paired lungs breathe as one continuous volume. Keeping a single
    // centre avoids the old three-part rotor logic tearing the organ apart.
    vec3 lungLocal = center - turbineCenter;
    float breath = sin(uTime * 0.58) * 0.026 * uMotionStrength * turbineStage;
    lungLocal.x *= 1.0 + breath;
    lungLocal.y *= 1.0 + breath * 0.34;
    lungLocal.z *= 1.0 + breath * 0.72;
    center = turbineCenter + lungLocal;

    float atomStage = smoothstep(3.62, 3.94, uStage) * (1.0 - smoothstep(4.12, 4.48, uStage));
    vec3 mainAtomCenter = vec3(-2.25, 0.0, 0.0);
    vec3 upperAtomCenter = mainAtomCenter;
    vec3 lowerAtomCenter = mainAtomCenter;
    float mainDistance = distance(center, mainAtomCenter);
    float upperDistance = distance(center, upperAtomCenter);
    float lowerDistance = distance(center, lowerAtomCenter);
    float atomForeground = 1.0 - step(2.72, min(mainDistance, min(upperDistance, lowerDistance)));
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
    vec3 investorCenter = vec3(-2.3, 0.02, 0.0);
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

    // The medical hero is a calm patient digital twin. It breathes and turns
    // slightly while the heart core sends a pressure wave through the scan
    // orbits; it must never collapse back into the old energy tunnel.
    float heroSpin = sin(uTime * 0.14) * 0.12 * uMotionStrength;
    float heroNod = sin(uTime * 0.18) * 0.035 * uMotionStrength;
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
    vec3 heroHeart = vec3(-0.22, 0.2, 0.42);
    float heartDistance = distance(localShape, heroHeart);
    float heartMask = 1.0 - smoothstep(0.12, 1.18, heartDistance);
    float heartbeat = pow(0.5 + 0.5 * sin(uTime * 2.25), 10.0);
    vec3 heartDirection = normalize(localShape - heroHeart + vec3(0.0001));
    localShape += heartDirection * heartbeat * heartMask * 0.065 * heroStage;
    float breathMask = 1.0 - smoothstep(0.65, 2.4, abs(localShape.y));
    localShape.xz *= 1.0 + sin(uTime * 0.72) * 0.018 * heroStage * breathMask;
    float scanRadius = length(vec2(localShape.x * 0.72, localShape.y));
    float scanWave = sin(uTime * 1.15 - scanRadius * 3.6 + aSeed * 4.0) * 0.012;
    localShape.z += scanWave * heroStage * uMotionStrength;

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
    shardVertex *= 1.0 + heroStage * heroStreakPulse * 0.28;
    shardVertex.x *= 1.0 + heroStage * 0.12;
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

    // The final stethoscope keeps the same clinical palette: teal tubing,
    // a white listening membrane and a subtle travelling ECG highlight.
    float finalStage = smoothstep(7.42, 7.88, uStage);
    vec3 finalColor = mix(amber, green, smoothstep(-4.5, -0.6, center.x) * 0.58);
    float chestDistance = distance(center.xy, vec2(-2.34, -1.12));
    float chestMask = 1.0 - smoothstep(0.34, 0.78, chestDistance);
    finalColor = mix(finalColor, whiteHot, chestMask * 0.88);
    float earMask = smoothstep(1.18, 1.48, center.y);
    finalColor = mix(finalColor, violet, earMask * 0.24);
    float finalCurrent = pow(
      0.5 + 0.5 * sin(uTime * 1.45 - center.x * 3.1 + aSeed * 1.8),
      10.0
    );
    vColor = mix(vColor, finalColor, finalStage * 0.9);
    vColor += whiteHot * finalStage * finalCurrent * 0.48;

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
    vec3 bulbLocal = center - vec3(-2.25, 0.02, 0.0);
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
      vec3(-2.3, 0.0, -0.1),
      vec3(2.28, 0.0, 0.14),
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
    vColor += whiteHot * contactGlow * 0.38;
    vAlpha = visibleIn * visibleOut * mix(0.72, 1.0, particleDepth) * (1.0 - exit * 0.38);
    vAlpha += contactGlow * 0.12;
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
  const TAU = Math.PI * 2;
  const center = { x: 2.15, y: 0.05, z: 0 };

  for (let i = 0; i < count; i += 1) {
    const kind = random();
    let x = 0;
    let y = 0;
    let z = 0;

    // A volumetric patient "digital twin": head and torso are sampled as
    // shells, with a live heart and diagnostic scan arcs visible through it.
    if (kind < 0.16) {
      const theta = random() * TAU;
      const phi = Math.acos(2 * random() - 1);
      const radius = 0.52 + (random() - 0.5) * 0.08;
      x = Math.cos(theta) * Math.sin(phi) * radius;
      y = 1.58 + Math.cos(phi) * radius * 1.08;
      z = Math.sin(theta) * Math.sin(phi) * radius * 0.9;
    } else if (kind < 0.53) {
      y = THREE.MathUtils.lerp(-1.85, 0.98, random());
      const normalizedY = (y + 0.42) / 1.45;
      const shoulder = Math.exp(-Math.pow((normalizedY - 0.68) / 0.32, 2));
      const waist = Math.exp(-Math.pow((normalizedY + 0.4) / 0.42, 2));
      const width = 0.72 + shoulder * 0.72 - waist * 0.18;
      const angle = random() * TAU;
      const shell = 0.86 + random() * 0.16;
      x = Math.cos(angle) * width * shell;
      z = Math.sin(angle) * width * 0.52 * shell;
      if (y < -1.28) {
        const legSide = random() < 0.5 ? -1 : 1;
        x = legSide * (0.28 + random() * 0.17) + (random() - 0.5) * 0.14;
        z *= 0.64;
      }
    } else if (kind < 0.7) {
      // Anatomical heart core, deliberately offset to the patient's left.
      const angle = random() * TAU;
      const fill = 0.24 + Math.sqrt(random()) * 0.76;
      const rawX = 16 * Math.pow(Math.sin(angle), 3);
      const rawY =
        13 * Math.cos(angle) -
        5 * Math.cos(2 * angle) -
        2 * Math.cos(3 * angle) -
        Math.cos(4 * angle);
      x = -0.22 + rawX * 0.021 * fill;
      y = 0.18 + rawY * 0.023 * fill;
      z = 0.42 + (random() - 0.5) * 0.38;
    } else if (kind < 0.91) {
      // Three tilted scan orbits make the body read as a clinical model rather
      // than a generic human silhouette.
      const orbit = Math.floor(random() * 3);
      const angle = random() * TAU;
      const radii = [
        [1.72, 0.84, 0.44],
        [1.43, 1.26, 0.7],
        [1.95, 1.56, 0.34],
      ][orbit];
      x = Math.cos(angle) * radii[0];
      y = 0.1 + Math.sin(angle) * radii[1];
      z = Math.sin(angle + orbit * 0.78) * radii[2];
      x += (random() - 0.5) * 0.055;
      y += (random() - 0.5) * 0.055;
    } else {
      // Circulating micro-signals fill the volume without hiding the anatomy.
      const angle = random() * TAU;
      const radius = 0.45 + Math.pow(random(), 0.72) * 1.85;
      x = Math.cos(angle) * radius * 0.86;
      y = (random() - 0.5) * 3.5;
      z = Math.sin(angle) * radius * 0.5;
    }

    data[i * 3] = center.x + x;
    data[i * 3 + 1] = center.y + y;
    data[i * 3 + 2] = center.z + z;
  }

  return data;
}

function makeCloud(count: number, random: () => number, spread = 1) {
  const data = new Float32Array(count * 3);
  const gaussian = (value: number, center: number, width: number) =>
    Math.exp(-Math.pow((value - center) / width, 2));
  for (let i = 0; i < count; i += 1) {
    if (random() < 0.7) {
      // A continuous ECG trace repeats across the viewport. The secondary,
      // translucent traces behind it produce depth without creating a wall.
      const progress = random();
      const cycle = (progress * 3.05) % 1;
      const trace =
        gaussian(cycle, 0.17, 0.035) * 0.18 -
        gaussian(cycle, 0.35, 0.022) * 0.24 +
        gaussian(cycle, 0.405, 0.013) * 1.36 -
        gaussian(cycle, 0.445, 0.018) * 0.54 +
        gaussian(cycle, 0.7, 0.07) * 0.34;
      const layer = Math.floor(random() * 4);
      data[i * 3] = THREE.MathUtils.lerp(-5.35, 5.35, progress) * spread;
      data[i * 3 + 1] =
        (trace - 0.16) * (1 - layer * 0.12) +
        (layer - 1.5) * 0.43 +
        (random() - 0.5) * 0.07;
      data[i * 3 + 2] = (layer - 1.5) * 0.42 + (random() - 0.5) * 0.22;
    } else {
      // Sparse blood-cell discs drift around the trace.
      const angle = random() * Math.PI * 2;
      const centerX = (random() - 0.5) * 9.4;
      const centerY = (random() - 0.5) * 4.1;
      const radius = 0.08 + random() * 0.22;
      data[i * 3] = centerX + Math.cos(angle) * radius;
      data[i * 3 + 1] = centerY + Math.sin(angle) * radius * 0.58;
      data[i * 3 + 2] = (random() - 0.5) * 2.8;
    }
  }
  return data;
}

function makeHeart(count: number, random: () => number) {
  const data = new Float32Array(count * 3);
  const centerX = -2.25;
  const centerY = 0.02;
  for (let i = 0; i < count; i += 1) {
    const kind = random();
    let x = 0;
    let y = 0;
    let z = 0;

    if (kind < 0.79) {
      const angle = random() * Math.PI * 2;
      const shell = random() < 0.78 ? 0.88 + random() * 0.15 : Math.sqrt(random()) * 0.86;
      const rawX = 16 * Math.pow(Math.sin(angle), 3);
      const rawY =
        13 * Math.cos(angle) -
        5 * Math.cos(2 * angle) -
        2 * Math.cos(3 * angle) -
        Math.cos(4 * angle);
      x = rawX * 0.103 * shell + rawY * 0.012;
      y = rawY * 0.108 * shell - 0.05;
      const radius = Math.min(1, Math.sqrt((x / 1.75) ** 2 + (y / 2.0) ** 2));
      const depth = 0.3 + 1.32 * Math.sqrt(Math.max(0.025, 1 - radius * radius));
      z = (random() - 0.5) * depth;
      // Chamber separation keeps the object anatomical instead of reading as
      // a flat valentine icon.
      z += Math.sin(angle * 2.0) * 0.14;
    } else if (kind < 0.94) {
      const vessel = random();
      const progress = random();
      const arch = Math.sin(progress * Math.PI);
      if (vessel < 0.68) {
        // Curved ascending aorta and arch. The bend removes the previous
        // rabbit-ear silhouette while retaining an unmistakable vessel crown.
        x = 0.08 - progress * 0.42 - arch * 0.58;
        y = 1.0 + progress * 0.78 + arch * 0.58;
        z = 0.1 + arch * 0.52;
      } else {
        // Shorter pulmonary trunk exits on a different depth plane.
        x = 0.17 + progress * 0.72;
        y = 0.95 + progress * 0.78 - arch * 0.08;
        z = -0.18 - arch * 0.32;
      }
      const halo = random() * Math.PI * 2;
      const thickness = 0.075 + progress * 0.045;
      x += Math.cos(halo) * thickness;
      z += Math.sin(halo) * thickness;
    } else {
      const angle = random() * Math.PI * 2;
      const radius = 1.88 + random() * 0.22;
      x = Math.cos(angle) * radius;
      y = Math.sin(angle) * radius * 0.78 + 0.05;
      z = (random() - 0.5) * 1.35;
    }

    data[i * 3] = centerX + x;
    data[i * 3 + 1] = centerY + y;
    data[i * 3 + 2] = z;
  }
  return data;
}

function makeLungs(count: number, random: () => number) {
  const data = new Float32Array(count * 3);
  const centerX = 2.15;
  for (let i = 0; i < count; i += 1) {
    const kind = random();
    let x = 0;
    let y = 0;
    let z = 0;

    if (kind < 0.76) {
      const side = random() < 0.5 ? -1 : 1;
      const vertical = random() * 2 - 1;
      const theta = random() * Math.PI * 2;
      const shell = random() < 0.8 ? 0.9 + random() * 0.12 : Math.cbrt(random()) * 0.88;
      const taper = Math.sqrt(Math.max(0.04, 1 - vertical * vertical));
      const upperNarrow = 0.72 + (1 - vertical) * 0.14;
      const lobe = 0.91 + Math.sin((vertical + 1) * Math.PI * 2.5) * 0.045;
      x = side * (0.93 + Math.cos(theta) * taper * 0.74 * upperNarrow * lobe * shell);
      y = vertical * 1.9 * shell - 0.02;
      z = Math.sin(theta) * taper * 0.86 * shell;
      // The medial notch near the heart separates the two lungs.
      if (side > 0 && x < 0.85 && y < 0.55 && y > -0.75) x += 0.2;
    } else if (kind < 0.95) {
      const side = random() < 0.5 ? -1 : 1;
      const branchDepth = Math.floor(random() * 4);
      const progress = random();
      const branchScale = 1 - branchDepth * 0.16;
      x = side * (0.08 + progress * (0.72 + branchDepth * 0.2));
      y = 1.85 - progress * (1.05 + branchDepth * 0.52);
      z = side * 0.04 + Math.sin(progress * Math.PI) * (branchDepth % 2 === 0 ? 0.34 : -0.34);
      const halo = random() * Math.PI * 2;
      const thickness = 0.055 * branchScale;
      x += Math.cos(halo) * thickness;
      z += Math.sin(halo) * thickness;
    } else {
      const progress = random();
      const halo = random() * Math.PI * 2;
      x = Math.cos(halo) * 0.11;
      y = 2.0 + progress * 0.84;
      z = Math.sin(halo) * 0.11;
    }

    data[i * 3] = centerX + x;
    data[i * 3 + 1] = y;
    data[i * 3 + 2] = z;
  }
  return data;
}

function makeBrain(count: number, random: () => number) {
  const data = new Float32Array(count * 3);
  const TAU = Math.PI * 2;
  const centerX = -2.25;

  for (let i = 0; i < count; i += 1) {
    const kind = random();
    let x = 0;
    let y = 0;
    let z = 0;

    if (kind < 0.73) {
      const side = random() < 0.5 ? -1 : 1;
      const theta = random() * TAU;
      const phi = Math.acos(2 * random() - 1);
      const gyri =
        1 +
        Math.sin(theta * 9 + phi * 5) * 0.07 +
        Math.sin(theta * 4 - phi * 12) * 0.05;
      const shell = (random() < 0.86 ? 0.9 + random() * 0.13 : Math.cbrt(random()) * 0.88) * gyri;
      x = side * 0.58 + Math.cos(theta) * Math.sin(phi) * 1.28 * shell;
      y = 0.18 + Math.cos(phi) * 1.02 * shell;
      z = Math.sin(theta) * Math.sin(phi) * 0.9 * shell;
    } else if (kind < 0.89) {
      // Brighter cortical ribbons trace several independent gyri across both
      // hemispheres, adding readable anatomical detail at landing-page scale.
      const side = random() < 0.5 ? -1 : 1;
      const band = Math.floor(random() * 5);
      const progress = random();
      const theta = progress * TAU + band * 0.71;
      const latitude = -0.72 + band * 0.36 + Math.sin(theta * 2.2) * 0.13;
      const rim = Math.sqrt(Math.max(0.08, 1 - latitude * latitude));
      x = side * 0.58 + Math.cos(theta) * 1.3 * rim;
      y = 0.18 + latitude * 1.02;
      z = Math.sin(theta) * 0.92 * rim + (random() - 0.5) * 0.08;
    } else if (kind < 0.97) {
      // Cerebellum.
      const theta = random() * TAU;
      const phi = Math.acos(2 * random() - 1);
      const shell = random() < 0.84 ? 0.9 + random() * 0.12 : Math.cbrt(random()) * 0.86;
      x = 0.52 + Math.cos(theta) * Math.sin(phi) * 0.72 * shell;
      y = -0.72 + Math.cos(phi) * 0.43 * shell;
      z = -0.48 + Math.sin(theta) * Math.sin(phi) * 0.58 * shell;
    } else {
      const progress = random();
      const halo = random() * TAU;
      x = 0.3 + Math.cos(halo) * 0.18 * (1 - progress * 0.5);
      y = -0.78 - progress * 0.78;
      z = -0.24 + Math.sin(halo) * 0.18 * (1 - progress * 0.5);
    }

    data[i * 3] = centerX + x;
    data[i * 3 + 1] = y;
    data[i * 3 + 2] = z;
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
  const TAU = Math.PI * 2;

  for (let i = 0; i < count; i += 1) {
    const kind = random();
    let x = 0;
    let y = 0;
    let z = 0;

    if (kind < 0.7) {
      // A universal clinical cross. Sampling its outer shell rather than a
      // filled block keeps the final object dimensional and unmistakable.
      const vertical = random() < 0.55;
      const halfX = vertical ? 0.52 : 1.62;
      const halfY = vertical ? 1.62 : 0.52;
      const face = Math.floor(random() * 6);
      x = (random() * 2 - 1) * halfX;
      y = (random() * 2 - 1) * halfY;
      z = (random() * 2 - 1) * 0.42;
      if (face === 0) x = -halfX;
      if (face === 1) x = halfX;
      if (face === 2) y = -halfY;
      if (face === 3) y = halfY;
      if (face === 4) z = -0.42;
      if (face === 5) z = 0.42;
      x -= 2.34;
    } else if (kind < 0.87) {
      // A living ECG signal runs through and beyond the cross.
      const progress = random();
      x = THREE.MathUtils.lerp(-5.15, 0.75, progress);
      const phase = (progress * 2.3) % 1;
      const gaussian = (value: number, center: number, width: number) =>
        Math.exp(-Math.pow((value - center) / width, 2));
      y =
        -1.72 +
        gaussian(phase, 0.39, 0.018) * 0.92 -
        gaussian(phase, 0.445, 0.028) * 0.36 +
        (random() - 0.5) * 0.055;
      z = -0.54 + (random() - 0.5) * 0.16;
    } else {
      // Particle halo gives the cross a quiet field without CSS orbit lines.
      const angle = random() * TAU;
      const radius = 1.9 + (random() - 0.5) * 0.18;
      x = -2.34 + Math.cos(angle) * radius;
      y = Math.sin(angle) * radius * 0.88;
      z = Math.sin(angle * 2) * 0.34 + (random() - 0.5) * 0.12;
    }

    data[i * 3] = x;
    data[i * 3 + 1] = y;
    data[i * 3 + 2] = z;
  }
  return data;
}

function makeAmbient(count: number, random: () => number) {
  const data = new Float32Array(count * 3);
  const TAU = Math.PI * 2;
  const center: [number, number, number] = [0.22, 0.02, 0];
  const branches = [
    { angle: -2.72, length: 2.2, lift: -0.32, depth: -0.46 },
    { angle: -2.16, length: 2.5, lift: 0.24, depth: 0.34 },
    { angle: -1.47, length: 2.05, lift: -0.18, depth: 0.48 },
    { angle: -0.7, length: 2.36, lift: 0.34, depth: -0.32 },
    { angle: 0.08, length: 2.2, lift: -0.24, depth: 0.38 },
    { angle: 0.76, length: 2.34, lift: 0.3, depth: -0.4 },
    { angle: 1.43, length: 2.02, lift: -0.22, depth: 0.44 },
    { angle: 2.17, length: 2.5, lift: 0.28, depth: -0.38 },
    { angle: 2.78, length: 2.15, lift: -0.26, depth: 0.32 },
  ];

  for (let i = 0; i < count; i += 1) {
    const kind = random();
    let x = center[0];
    let y = center[1];
    let z = center[2];

    if (kind < 0.24) {
      // Volumetric neural soma: a softly faceted clinical signal core.
      const theta = random() * TAU;
      const phi = Math.acos(2 * random() - 1);
      const radius = 0.42 + Math.pow(random(), 0.52) * 0.42;
      x += Math.cos(theta) * Math.sin(phi) * radius;
      y += Math.cos(phi) * radius * 0.9;
      z += Math.sin(theta) * Math.sin(phi) * radius * 0.86;
    } else if (kind < 0.84) {
      // Dendrites use curved, narrowing particle ribbons instead of a
      // screen-filling random cloud, preserving the nearby clinical copy.
      const branch = branches[Math.floor(random() * branches.length)];
      const progress = Math.pow(random(), 0.82);
      const curve = Math.sin(progress * Math.PI);
      const tangentX = Math.cos(branch.angle);
      const tangentY = Math.sin(branch.angle);
      const normalX = -tangentY;
      const normalY = tangentX;
      const width = (0.11 + curve * 0.12) * (1 - progress * 0.72);
      const fork = progress > 0.62 && random() < 0.42 ? (progress - 0.62) * (random() > 0.5 ? 1 : -1) : 0;
      x +=
        tangentX * branch.length * progress +
        normalX * (curve * branch.lift + fork * 0.8) +
        (random() - 0.5) * width;
      y +=
        tangentY * branch.length * progress +
        normalY * (curve * branch.lift + fork * 0.8) +
        (random() - 0.5) * width;
      z +=
        Math.sin(progress * Math.PI * 1.35) * branch.depth +
        fork * 0.34 +
        (random() - 0.5) * width * 1.7;
    } else {
      // Synaptic halos sit at branch endings and give the neural object clear
      // medical readouts without adding separate CSS circles.
      const branch = branches[Math.floor(random() * branches.length)];
      const haloAngle = random() * TAU;
      const haloRadius = 0.12 + random() * 0.22;
      const endX = center[0] + Math.cos(branch.angle) * branch.length;
      const endY = center[1] + Math.sin(branch.angle) * branch.length;
      x = endX + Math.cos(haloAngle) * haloRadius;
      y = endY + Math.sin(haloAngle) * haloRadius * 0.78;
      z = branch.depth * 0.18 + Math.sin(haloAngle) * haloRadius * 0.72;
    }

    data[i * 3] = x;
    data[i * 3 + 1] = y;
    data[i * 3 + 2] = z;
  }
  return data;
}

function makeLiver(count: number, random: () => number) {
  const data = new Float32Array(count * 3);
  const TAU = Math.PI * 2;
  for (let i = 0; i < count; i += 1) {
    const kind = random();
    let x = 0;
    let y = 0;
    let z = 0;

    if (kind < 0.58) {
      // Dominant right lobe: wide, shallow and gently wedged.
      const theta = random() * TAU;
      const phi = Math.acos(2 * random() - 1);
      const shell = random() < 0.86 ? 0.9 + random() * 0.12 : Math.cbrt(random()) * 0.86;
      x = -2.72 + Math.cos(theta) * Math.sin(phi) * 1.72 * shell;
      y = 0.02 + Math.cos(phi) * 1.16 * shell - Math.max(0, x + 2.1) * 0.08;
      z = Math.sin(theta) * Math.sin(phi) * 0.72 * shell;
      y = Math.min(y, 0.92 + Math.sin(theta) * 0.06);
    } else if (kind < 0.82) {
      // Smaller left lobe overlaps the main lobe and creates the recognizable
      // asymmetric hepatic silhouette instead of a generic sphere.
      const theta = random() * TAU;
      const phi = Math.acos(2 * random() - 1);
      const shell = random() < 0.88 ? 0.91 + random() * 0.1 : Math.cbrt(random()) * 0.88;
      x = -1.15 + Math.cos(theta) * Math.sin(phi) * 1.42 * shell;
      y = 0.28 + Math.cos(phi) * 0.86 * shell;
      z = Math.sin(theta) * Math.sin(phi) * 0.54 * shell;
      y -= Math.max(0, x + 0.9) * 0.16;
    } else if (kind < 0.95) {
      // Portal-vein branches on the front surface.
      const branch = random() < 0.54 ? -1 : 1;
      const progress = random();
      const halo = random() * TAU;
      x = -2.28 + branch * progress * (branch > 0 ? 1.48 : 1.18) + Math.cos(halo) * 0.055;
      y = -0.08 + Math.sin(progress * Math.PI) * 0.42 - progress * 0.5 + Math.sin(halo) * 0.055;
      z = 0.66 - progress * 0.18;
    } else {
      // Inferior edge accent keeps the two lobes visually joined.
      const progress = random();
      x = THREE.MathUtils.lerp(-4.25, 0.22, progress);
      y = -0.88 + Math.sin(progress * Math.PI) * -0.34 + (random() - 0.5) * 0.08;
      z = (random() - 0.5) * 0.44;
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
    makeHeart(count, random),
    makeLungs(count, random),
    makeBrain(count, random),
    makeAmbient(count, random),
    makeLiver(count, random),
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
    const lowMemoryDevice = (navigator as Navigator & { deviceMemory?: number }).deviceMemory !== undefined &&
      ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) <= 4;
    const constrainedDevice = lowCoreDevice || lowMemoryDevice;
    const count = reducedMotion ? 1800 : mobile ? 3000 : constrainedDevice ? 4800 : 8200;
    const targets = makeTargets(count);
    const formCenters = [
      new THREE.Vector3(2.15, 0.05, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-2.25, 0.02, 0),
      new THREE.Vector3(2.15, 0, 0),
      new THREE.Vector3(-2.25, 0, 0),
      new THREE.Vector3(0.22, 0.02, 0),
      new THREE.Vector3(-2.3, 0.04, 0),
      new THREE.Vector3(0, 0.04, 0),
      new THREE.Vector3(-2.34, 0, 0),
    ];
    const volumeStrengths = [1, 0.06, 0.94, 0.9, 0.96, 0.46, 0.9, 0.34, 0.58];
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

      const handCount = reducedMotion ? 3000 : mobile ? 5800 : constrainedDevice ? 8600 : 14200;
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
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1 : constrainedDevice ? 1.08 : 1.25));
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      if (handParticles) {
        const handScaleX = THREE.MathUtils.clamp(
          camera.aspect * 0.68 - 0.056,
          0.78,
          1.25,
        );
        handParticles.scale.set(handScaleX, 1.04, 1);
      }
      anchors = sections.map((section) => {
        const requestedRatio = Number(section.dataset.particleAnchor ?? 0.5);
        const ratio = Number.isFinite(requestedRatio)
          ? THREE.MathUtils.clamp(requestedRatio, 0.08, 0.92)
          : 0.5;
        return section.offsetTop + section.offsetHeight * ratio;
      });
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
    if (!mobile && !reducedMotion) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerleave", onPointerLeave);
    }

    const startedAt = performance.now();
    let previousFrameAt = startedAt;
    let previousDrawAt = 0;
    const targetFrameDuration = reducedMotion
      ? 1000 / 20
      : mobile
        ? 1000 / 30
        : constrainedDevice
          ? 1000 / 45
          : 0;
    let frame = 0;
    const render = () => {
      if (disposed) return;
      frame = window.requestAnimationFrame(render);
      const now = performance.now();
      if (document.hidden) return;
      if (targetFrameDuration && now - previousDrawAt < targetFrameDuration) return;
      previousDrawAt = now;
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
    };
    frame = window.requestAnimationFrame(render);

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
