import React, { useEffect, useRef, useState } from 'react'
import FeatherIcon from 'feather-icons-react';

const Cameras = (props) => {
  const [videoDevices, setVideoDevices] = useState([])
  const cameraOptions = useRef()
  const video = useRef()
  const canvas = useRef()
  const play = useRef();
  const screenshot = useRef();
  const video_constraints = {};

  const cameraOptionsOnChange = () => {
    const updatedConstraints = {
      video: {
        ...video_constraints,
        deviceId: {
          exact: cameraOptions.current.value
        }
      }
    };
    startStream(updatedConstraints);
  };

  const onPlay = () => {
    if ('mediaDevices' in navigator && navigator.mediaDevices.getUserMedia) {
      const updatedConstraints = {
        video: {
          ...video_constraints,
          deviceId: {
            exact: cameraOptions.current.value
          }
        }
      };
      startStream(updatedConstraints);
    }
  };

  const submitPicture = () => {
    canvas.current.width = video.current.videoWidth;
    canvas.current.height = video.current.videoHeight;
    canvas.current.getContext('2d').drawImage(video.current, 0, 0);
    canvas.current.toBlob(function(blob){
      props.storeFiles([{file_data: blob, preview: URL.createObjectURL(blob)}])
    },'image/png');
    // const submitImage = canvas.current.toDataURL("image/png").replace("image/png", "image/octet-stream");
  };

  const startStream = async (video_constraints) => {
    const stream = await navigator.mediaDevices.getUserMedia(video_constraints);
    handleStream(stream);
  };

  const handleStream = (stream) => {
    video.current.srcObject = stream;
    play.current.classList.add('d-none');
    screenshot.current.classList.remove('d-none');
  };

  const getCameraSelection = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    setVideoDevices(devices.filter(device => device.kind === 'videoinput'));
  };

  useEffect(() => {
    getCameraSelection();
  }, []);

  return (
    <div>
      <div className="video-container">
        <video ref={video} autoPlay></video>
        <canvas ref={canvas} className="d-none"></canvas>
      </div>

      <div className="video-options">
        <select ref={cameraOptions} onChange={cameraOptionsOnChange} className="form-select" style={{ backgroundColor: '#fffafa'}}>
          {
            videoDevices.map((videoDevice, idx) => <option key={idx} value={videoDevice.deviceId}>{videoDevice.label}</option>)
          }
        </select>
      </div>

      <div className="mt-2 mb-4">
        <button onClick={onPlay} ref={play} className="btn play w-100" title="Play"><FeatherIcon icon="video" size="22" style={{marginBottom: '5px'}}/><span className='ms-2'>Nyalakan Kamera</span></button>
        <button className="btn screenshot d-none w-100" ref={screenshot} title="ScreenShot" onClick={submitPicture}><FeatherIcon icon="image" size="22" style={{marginBottom: '5px'}}/><span className='ms-2'>Ambil Gambar</span></button>
      </div>
    </div>
  )
}

export default Cameras