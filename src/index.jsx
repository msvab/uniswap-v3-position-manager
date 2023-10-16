import { render } from 'preact';
import { PositionsList } from './components/PositionsList.jsx';

import './css/style.css';
import { Chains } from './components/Chains.jsx';
import { initClients } from './logic/clients.js';

const App = () => (
  <div>
    <h1>Uniswap Position Manager</h1>
    <Chains />
    <PositionsList />
  </div>
);

await initClients();
render(<App />, document.getElementById('app'));
