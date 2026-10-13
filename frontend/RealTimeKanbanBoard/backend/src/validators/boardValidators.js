const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCreateBoard(req, res, next) {
  const { title, description } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0 || title.trim().length > 100) {
    return res.status(400).json({
      success: false,
      error: 'Board title is required and must be between 1 and 100 characters.',
    });
  }

  if (description && (typeof description !== 'string' || description.trim().length > 500)) {
    return res.status(400).json({
      success: false,
      error: 'Description cannot exceed 500 characters.',
    });
  }

  next();
}

export function validateInviteMember(req, res, next) {
  const { email, role } = req.body;

  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    return res.status(400).json({
      success: false,
      error: 'A valid member email address is required.',
    });
  }

  if (role && !['admin', 'member'].includes(role)) {
    return res.status(400).json({
      success: false,
      error: 'Member role must be either "admin" or "member".',
    });
  }

  next();
}
