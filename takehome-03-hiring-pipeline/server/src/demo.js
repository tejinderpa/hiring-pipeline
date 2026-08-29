import { Router } from 'express';

import { authenticate, requireRole } from './auth.js';

const router = Router();

router.get('/recruiter-only', authenticate, requireRole('RECRUITER'), (req, res) => {
  res.json({
    message: 'Recruiter access granted',
    user: req.auth.user,
  });
});

router.get('/interviewer-only', authenticate, requireRole('INTERVIEWER'), (req, res) => {
  res.json({
    message: 'Interviewer access granted',
    user: req.auth.user,
  });
});

export default router;
