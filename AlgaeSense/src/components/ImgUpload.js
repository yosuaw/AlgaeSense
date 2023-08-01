import styled from 'styled-components';

const ImgUpload = styled.div`
flex-direction: row;
text-align: center;
margin: 10px;
background-image: ${(props) => (props.preview ? `url(${props.preview})` : null)} ;
min-height: 100px;
min-width: 100px;
border-radius: 5px;
background-repeat: no-repeat;
background-size: cover;
background-position: 50% 50%;
margin-right: 5px;
`;

export default ImgUpload