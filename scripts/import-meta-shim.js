import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = typeof __filename !== 'undefined' ? __filename : '';
const __dirname = typeof __dirname !== 'undefined' ? __dirname : dirname(fileURLToPath(import.meta.url));

export { __filename, __dirname };