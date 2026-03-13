// Extract Device ID from authorization header
export function verifyDeviceId(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    const deviceId = authHeader.split(' ')[1];
    return deviceId;
  } catch (error) {
    return null;
  }
}
