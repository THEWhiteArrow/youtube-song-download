import logo from './logo.svg';
import './App.css';
import { Link, Route, Routes } from 'react-router-dom';
import Downloader from './Downloader';

function App() {
  return (
    <div className='App'>
      <h1>Download from YT</h1>
      <Link to='/'>Main page</Link>
      <br />
      <Link to='/download/songs'>Download songs</Link>
      <Routes>
        <Route exact path='/download/songs' element={<Downloader />} />
      </Routes>
    </div>
  );
}

export default App;
