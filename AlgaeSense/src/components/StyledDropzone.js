import styled from 'styled-components';

const getColor = (props) => {
  if (props.isDragAccept) {
      return '#00e676';
  }
  if (props.isDragReject) {
      return '#ff1744';
  }
  if (props.isFocused) {
      return '#2196f3';
  }
  return '#eeeeee';
}

const StyledDropzone = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border-width: 2px;
  border-radius: 2px;
  // border-color: ${props => getColor(props)};
  border-style: dashed;
  background-color: #d8d8d8;
  // color: #bdbdbd;
  outline: none;
  transition: border .24s ease-in-out;
`;

export default StyledDropzone