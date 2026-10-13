const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegister(req, res, next) {
  const { name, email, password, role } = req.body;

  if (role && role !== 'user') {
    return res.status(400).json({
      success: false,
      error: 'Public registration allows only standard user accounts. Privilege escalation rejected.',
    });
  }

  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 60) {
    return res.status(400).json({
      success: false,
      error: 'Name is required and must be between 2 and 60 characters.',
    });
  }

  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    return res.status(400).json({
      success: false,
      error: 'A valid email address is required.',
    });
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'Password is required and must be at least 8 characters long.',
    });
  }

  next();
}

export function validateLogin(req, res, next) {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    return res.status(400).json({
      success: false,
      error: 'Valid email is required.',
    });
  }

  if (!password || typeof password !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Password is required.',
    });
  }

  next();
}

export function validateAdminLogin(req, res, next) {
  const { adminId, password } = req.body;

  if (!adminId || typeof adminId !== 'string' || adminId.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Admin ID is required.',
    });
  }

  if (!password || typeof password !== 'string' || password.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Admin password is required.',
    });
  }

  next();
}
