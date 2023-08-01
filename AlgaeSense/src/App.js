import { useRef, useState, useEffect} from 'react';
import './App.css';
import Cameras from './components/Cameras';
import Dropzone from './components/Dropzone';
import Navbar from './components/Navbar';
import UploadImageCard from './components/UploadImageCard';
import FeatherIcon from 'feather-icons-react/build/FeatherIcon';
import axios from 'axios';

function App() {
  const [files, setFiles] = useState([]);
  const [predictionMethod, setPredictionMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [predictions, setPrediction] = useState([]);
  const labelImgTaken = useRef();
  const btnDelImg = useRef();
  const labelResult = useRef();
  const storeFiles = (file) => { setFiles([...files, ...file]) }
  const clearFiles = () => { setFiles([]) }

  const DRONE = 'Drone'
  const KAMERA_MIKROSKOP = 'Kamera Mikroskop'
  const MIKROSKOP_DIGITAL = 'Mikroskop Digital'


  useEffect(() => {
    if(files.length === 0) {
      labelImgTaken.current.classList.add('d-none');
      btnDelImg.current.classList.add('d-none');
    }
    else {
      labelImgTaken.current.classList.remove('d-none');
      btnDelImg.current.classList.remove('d-none');
      labelImgTaken.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setPrediction([]);  
    }
  }, [files]);

  const sendFile = async (selectedFile) => {
    let formData = new FormData();
    formData.append("file", selectedFile);
    var prediction_method_url = ""
    if(predictionMethod === DRONE) {
      prediction_method_url = "http://localhost:8000/predict/drone"
    }
    else if(predictionMethod === KAMERA_MIKROSKOP) {
      prediction_method_url = "http://localhost:8000/predict/mikroskop"
    }
    else if(predictionMethod === MIKROSKOP_DIGITAL) {
      prediction_method_url = "http://localhost:8000/predict/mikroskop-digital"
    }

    let res = await axios({method: "post", url: prediction_method_url, data: formData,}).then(setLoading(true));

    if (res.status === 200) {
      setLoading(false);
      return res.data 
    } 
    else return { 'errors': 'Server Error' }
  }


  const predictFiles = async () => {
    // const t0 = performance.now();
    var tmp_predict = []
    for (const file of files) {
      // There is file_data and preview inside const file
      const output = await sendFile(file.file_data)
      tmp_predict = [...tmp_predict, { ...file, output: {...output}}]
    }

    setFiles([])
    setPrediction(tmp_predict)
    labelResult.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // const t1 = performance.now();
    // console.log(`Call to prediction took ${t1 - t0} milliseconds.`);
  }

  const onPredictionMethodChanged = function (e) {
      setPredictionMethod(e.currentTarget.value);
  }

  return (
    <div className='pt-5'>
      <Navbar />
      <main className="container">
        <div className="card rounded-4 border-0 shadow">
          <div className="card-body">
            <h2 className='mt-2 mb-0'>
              Input Gambar
            </h2>
            <br />
            <Cameras storeFiles={storeFiles} />
            <Dropzone storeFiles={storeFiles} />
          </div>  
        </div>


        <div ref={labelImgTaken} className="card rounded-4 border-0 shadow">
          <div className="card-body">
            <h2 className='my-2'>Gambar yang telah diambil</h2>
            <aside className='text-center'>
              {files.map((file, idx) => 
                <UploadImageCard key={idx}>
                  <img src={file.preview} alt='captured_images'/>
                  <p className='badge bg-primary'>{file.file_data.type}</p>
                </UploadImageCard>)}
            </aside>
            <hr className='my-3'/>
            <div>
              <button ref={btnDelImg} className='btn w-100 mt-2 mb-3 d-none' onClick={clearFiles}><FeatherIcon icon="trash-2" size="22" style={{marginBottom: '5px'}}/><span className='ms-2'>Hapus Gambar</span></button>
            </div>
          </div>
        </div>
    
        <div className="card rounded-4 border-0 shadow">
          <div className="card-body">
            <h2 className='my-2'>Pengaturan</h2>
            <p>Pilih tipe gambar yang ingin diprediksi: </p>
            
            <div>
              <input role={`button`} type="radio" name='prediction_method' value={KAMERA_MIKROSKOP} id='kamera_mikroskop' onChange={onPredictionMethodChanged} />
              <label role={`button`} htmlFor='kamera_mikroskop' className='ms-2'>{KAMERA_MIKROSKOP}</label>
            </div>
            <div>
              <input role={`button`} type="radio" name='prediction_method' value={DRONE} id='drone' onChange={onPredictionMethodChanged}/>
              <label role={`button`} htmlFor='drone' className='ms-2'>{DRONE}</label>
            </div>
            <div>
              <input role={`button`} type="radio" name='prediction_method' value={MIKROSKOP_DIGITAL} id='mikroskop_digital' onChange={onPredictionMethodChanged} />
              <label role={`button`} htmlFor='mikroskop_digital' className='ms-2'>{MIKROSKOP_DIGITAL}</label>
            </div>


            <hr className='my-4'/>
            <div className='my-4'>
              {
                files.length === 0 ?
                <button className={`btn w-100 disabled`}><FeatherIcon icon="info" size="22" style={{marginBottom: '5px'}}/><span className='ms-2 txt-dark'>Input Gambar Terlebih Dahulu</span></button>
                :
                predictionMethod === '' ?
                <button className={`btn w-100 disabled`}><FeatherIcon icon="arrow-up" size="22" style={{marginBottom: '6px'}}/><span className='ms-2 txt-dark'>Pilih Pengaturan Terlebih Dahulu!</span></button>
                :
                <button className={`btn w-100`} onClick={predictFiles}><FeatherIcon icon="check-circle" size="22" style={{marginBottom: '5px'}}/><span className='ms-2'>Prediksi Gambar {predictionMethod}!</span></button>
              }
            </div>
          </div>
        </div>


        <div className="card rounded-4 border-0 shadow">
          <div className="card-body">
            <h2 ref={labelResult} className='my-2'>Hasil Prediksi</h2>
              {
                (loading===false)? 
                  (predictionMethod === DRONE && predictions !== null)?
                    predictions.map((file, idx) => 
                      file.output.status === 0 ?
                        <h4>Gambar input bukan gambar alga aerial!</h4>
                      :
                        <UploadImageCard key={idx}>
                          <img src={file.preview} alt='hasil_prediksi' />
                          <p className='badge bg-primary'>{file.file_data.type}</p>
                          {Object.keys(file.output.alga).map((output_key, idx) => 
                            {
                              return <p key={idx}>{output_key} <span className='badge bg-success'>{file.output.alga[output_key]}</span></p>
                            }
                          )}
                        </UploadImageCard>
                    )
                  :
                    predictions.map((file, idx) =>
                      <div className='mt-4 px-4' key={idx}>
                        <div style={{width: '100%', float:'left'}}>
                          <img className='mb-3' src={file.output.imgResult} alt='imgResult' style={{width: '100%', maxWidth: '360px', height: 'auto', float:'left'}}></img>
                        
                        {
                          file.output.status === 0 ?
                            <h4 style={{ float:'none', paddingTop:'11%' }}>Tidak ada objek alga pada gambar input!</h4>
                          :
                          <>
                            <div className='image-legend'>
                              <p>Keterangan:</p>
                              <ul className='legend-labels'>
                                {Object.keys(file.output.legend).map((output_key, idx) => 
                                  <li key={idx}><span style={{background:file.output.legend[output_key]}}></span>{output_key}</li>
                                )}
                              </ul>
                            </div>
                            <div className='mb-4 text-start' style={{clear: 'both'}}>
                              <h5 className='mb-0 fw-bold'><u>Persentase:</u></h5>
                              {
                                Object.keys(file.output.persentase).map((key, idx) => 
                                  <p key={idx}>{key} <span className='badge bg-success'>{file.output.persentase[key]}%</span></p>
                                )
                              }
                            </div>
        
                            <h5 className='mb-0 text-start fw-bold'><u>Detail:</u></h5>
                            <table className="table table-active table-striped table-bordered mb-4">
                              <thead>
                                <tr>
                                  <th scope="col">No.</th>
                                  <th scope="col">Jenis</th>
                                  <th scope="col">Jumlah</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.keys(file.output.alga).map((output_key, idx) => 
                                  <tr key={idx}>
                                    <th scope="row">{idx + 1}</th>
                                    <td>{output_key}</td>
                                    <td>{file.output.alga[output_key]}</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </>  
                        }
                        </div>
                      </div>
                    )
                :
                <div className='text-center'>
                  <span className="spinner-border" role="status" style={{width: '3rem', height: '3rem'}}></span>
                  <div><b>Loading...</b></div>
                </div>
              }
          </div>
        </div>
        
      </main>
    </div>
  );
}

export default App;
