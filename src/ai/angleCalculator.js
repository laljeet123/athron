function getLandmark(landmarks, index) {
  if (!landmarks) return null;
  if (Array.isArray(landmarks)) {
    return landmarks[index] || null;
  }
  return landmarks[index] || landmarks[`left_${index}`] || landmarks[`right_${index}`] || null;
}

export function calculateAngle(a, b, c) {
  if (!a || !b || !c) return null;

  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let degrees = (radians * 180) / Math.PI;
  if (degrees < 0) degrees += 360;
  if (degrees > 180) degrees = 360 - degrees;

  return Math.round(degrees);
}

export function shoulderAngle(landmarks) {
  return calculateAngle(getLandmark(landmarks, 13), getLandmark(landmarks, 11), getLandmark(landmarks, 23));
}

export function elbowAngle(landmarks) {
  return calculateAngle(getLandmark(landmarks, 11), getLandmark(landmarks, 13), getLandmark(landmarks, 15));
}

export function hipAngle(landmarks) {
  return calculateAngle(getLandmark(landmarks, 11), getLandmark(landmarks, 23), getLandmark(landmarks, 25));
}

export function kneeAngle(landmarks) {
  return calculateAngle(getLandmark(landmarks, 23), getLandmark(landmarks, 25), getLandmark(landmarks, 27));
}
