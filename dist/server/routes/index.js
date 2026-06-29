"use strict";
const { Router } = require('express');
const adminRouter = require('./admin');
const kbRouter = require('./kb');
const statsRouter = require('./stats');
const skillRouter = require('./skill');
const diagRouter = require('./diag');
const router = Router();
router.use(adminRouter);
router.use(kbRouter);
router.use(statsRouter);
router.use(skillRouter);
router.use('/diag', diagRouter);
module.exports = router;
//# sourceMappingURL=index.js.map