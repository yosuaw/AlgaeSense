import React from 'react';
import {useDropzone} from 'react-dropzone';
import StyledDropzone from './StyledDropzone'
// import Tiff from 'tiff.js'

const Dropzone = (props) => { 
  const onDrop = (acceptedFiles) => {
    const mappedFiles = acceptedFiles.map((file) => {
      // if (file.type === 'image/tiff') {
        // Change this if tiff to png is available
        // var tiff = new Tiff({buffer: file});
        // var canvas = tiff.toCanvas();
      //   return {file_data: file, preview: URL.createObjectURL(file),}
      // } else {
        return {file_data: file, preview: URL.createObjectURL(file),}
      // }
    })
    props.storeFiles(mappedFiles)
  }

  const {
    getRootProps,
    getInputProps,
    isFocused,
    isDragAccept,
    isDragReject
  } = useDropzone({ accept: {'image/jpeg': [],'image/png': [],'image/tif': [],'image/tiff': []}, onDrop});

  return (
    <section className="mb-3">
      <StyledDropzone {...getRootProps({ className: 'dropzone', isFocused, isDragAccept, isDragReject })}>
        <input {...getInputProps()} />
        <p>Klik atau drag gambar ke area ini untuk mengunggah file gambar</p>
        <em>(Format gambar yang diterima: *.jpeg, *.jpg, *.png, dan *.tiff)</em>
      </StyledDropzone>
    </section>
  );
}

export default Dropzone;