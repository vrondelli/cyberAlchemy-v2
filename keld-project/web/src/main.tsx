import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import '../../prototype/assets/styles.css';
import '../../prototype/assets/shop.css';
import '../../prototype/assets/alpha.css';
import '../../prototype/assets/legend.css';
import '../../prototype/assets/ui-review.css';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('KELD root element is missing');

createRoot(root).render(<App />);
