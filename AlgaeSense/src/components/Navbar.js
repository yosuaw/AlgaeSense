import logoUbaya from '../images/logo-ubaya.png';
import logoSSM from '../images/logo-ssm.png';

function Navbar(props) {
  return (
    <nav className="navbar navbar-light bg-light fixed-top">
      <div className="container-fluid">
        <span className="navbar-brand">
          <img src={logoUbaya} width="30" height="30" className="d-inline-block align-text-top" alt="Logo Ubaya"/>
          <span style={{fontSize:"22px", align:"center", marginRight: "15px", marginLeft: "15px", fontFamily: "Rubik-ExtraBold", fontWeight: "bolder"}}>
            <span style={{ color:"#228b22" }}>Algae</span><span style={{ color:"#fca510" }}>Sense</span><span style={{ color:"#172808" }}> | </span><span style={{ fontSize:"18px" }}>Your Algae Predictor</span>
          </span>
          <img src={logoSSM} width="30" height="30" className="d-inline-block align-text-top" alt="Logo PT SSM"/> 
        </span>
      </div>
    </nav>
  );
}

export default Navbar