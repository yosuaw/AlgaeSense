from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
import uvicorn
import numpy as np
from io import BytesIO
from PIL import Image
import os

# for YOLO
import base64
import torch
import cv2
from collections import Counter


app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MODEL_DRONE = tf.keras.models.load_model(os.path.join("models", "drone", "fix_model"))
# CLASS_NAMES_DRONE = ['Green algae', 'Blue Green', 'Chrysophyta algae', 'Euglenophyta', 'Dinoflagellata', 'Protozoa']

MODEL_MIKROSKOP = tf.keras.models.load_model(os.path.join("models", "mikroskop", "best"))
YOLO_MIKROSKOP = torch.hub.load('yolov5-master', 'custom', source='local', path=os.path.join("models", "mikroskop",'best.pt'), force_reload=True)
YOLO_MIKROSKOP.conf = 0.1
YOLO_MIKROSKOP.iou = 0.42
CLASS_NAMES_MIKROSKOP = ['Blue Green Algae', 'Diatom', 'Dinoflagellata', 'Euglenozoa', 'Green Algae']

# MODEL_MIKROSKOP_DIGITAL = tf.keras.models.load_model(os.path.join("models", "mikroskop-digital", "model"))
# YOLO_MIKROSKOP_DIGITAL = torch.hub.load('yolov5-master', 'custom', source='local', path=os.path.join("models", "mikroskop-digital", 'best.pt'), force_reload=True)
# CLASS_NAMES_MIKROSKOP_DIGITAL = ['Chaetoceros', 'Nannochloropsis', 'Skeletonema', 'Thalassiosira']
# YOLO_MIKROSKOP_DIGITAL = torch.hub.load('ultralytics/yolov5', 'yolov5s')


@app.get('/ping')
async def ping():
  return "FastAPI is Healthy"

@app.post('/predict/drone')
async def predict_drone(
  file: UploadFile = File(...) # We're also setting the default value
):
  # Convert the uploaded file read from bytes to numpy format
  image = read_file_as_image_and_normalization(await file.read())
  img_batch = np.expand_dims(image, 0)
  prob_result = MODEL_DRONE.predict(img_batch)
  sum = np.sum(prob_result)
  return_HTTP = {'status': 1, 'alga':{}}

  if len(prob_result):
    return_HTTP['alga'].update({"Green Algae": str(round(float(prob_result[0][0]/sum) * 100, 2)) + '%'})
    return_HTTP['alga'].update({"BlueGreen Algae": str(round(float(prob_result[0][1]/sum) * 100, 2)) + '%'})
    return_HTTP['alga'].update({"Chrysophyta": str(round(float(prob_result[0][2]/sum) * 100, 2)) + '%'})
    return_HTTP['alga'].update({"Euglenophyta": str(round(float(prob_result[0][3]/sum) * 100, 2)) + '%'})
    return_HTTP['alga'].update({"Dinoflagellata": str(round(float(prob_result[0][4]/sum) * 100, 2)) + '%'})
    return_HTTP['alga'].update({"Protozoa": str(round(float(prob_result[0][5]/sum) * 100, 2)) + '%'})
  else:
    return_HTTP['status'] = 0

  return return_HTTP

@app.post('/predict/mikroskop-digital')
async def predict_mikroskop_digital(
  file: UploadFile = File(...)
):
  return_HTTP = {'imgResult': '', 'status': 1, 'alga':{}, 'persentase':{}, 'legend': {}}
  image = read_file(await file.read())
  
  # YOLO
  yolo_result = YOLO_MIKROSKOP_DIGITAL(image)
  yolo_result.print()
  image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
  image_return = image.copy()
  images_object = []
  coordinates = []
  num_result = len(yolo_result.xyxy[0])

  # Cropping Object
  if num_result != 0:
    for index, coordinate in enumerate(yolo_result.xyxy[0]):
        x_start = int(coordinate[0])
        y_start = int(coordinate[1])
        x_end = int(coordinate[2])
        y_end = int(coordinate[3])

        coordinates.append([x_start, y_start, x_end, y_end])

        cropped = image[y_start:y_end, x_start:x_end]
        crop_rgb = cv2.cvtColor(cropped, cv2.COLOR_BGR2RGB)
        images_object.append(crop_rgb)

    # Predict Object/Classification
    images_classification = []
    for image_object in images_object:
      image_classification = tf.image.resize(image_object, [160,160], method='nearest')
      image_classification = image_classification/255
      images_classification.append(image_classification)
    
    predict_result = MODEL_MIKROSKOP_DIGITAL.predict(np.array(images_classification))
    classification_result = [CLASS_NAMES_MIKROSKOP_DIGITAL[i] for i in np.argmax(predict_result, axis=1)]

    x = 0
    for algae_name in classification_result:
      if (algae_name == "Chaetoceros"):
        cv2.rectangle(image_return, (coordinates[x][0], coordinates[x][1]), (coordinates[x][2], coordinates[x][3]), (0, 0, 255), 1)
      elif (algae_name == "Thalassiosira"):
        cv2.rectangle(image_return, (coordinates[x][0], coordinates[x][1]), (coordinates[x][2], coordinates[x][3]), (255, 0, 0), 1)
      elif (algae_name == "Skeletonema"):
        cv2.rectangle(image_return, (coordinates[x][0], coordinates[x][1]), (coordinates[x][2], coordinates[x][3]), (0, 255, 0), 1)
      elif (algae_name == "Nannochloropsis"):
        cv2.rectangle(image_return, (coordinates[x][0], coordinates[x][1]), (coordinates[x][2], coordinates[x][3]), (0, 255, 255), 1)
      x = x + 1

    # Menyimpan hasil gambar bounding box
    image_encode = cv2.imencode('.jpg', image_return)[1]
    return_HTTP['imgResult'] = 'data:image/jpeg;base64,' + str(base64.b64encode(image_encode).decode("utf-8"))

    num_algae = len(classification_result)
    num_each_algae = dict(Counter(classification_result))
    for algae_name, value in num_each_algae.items():
      algae_name = str(algae_name)
      # Jumlah alga
      return_HTTP['alga'].update({algae_name: value})
      legend = ""

      # Legend
      if (algae_name == "Chaetoceros"):
        legend = "rgb(255, 0, 0)"
      elif (algae_name == "Thalassiosira"):
        legend = "rgb(0, 0, 255)"
      elif (algae_name == "Skeletonema"):
        legend = "rgb(0, 255, 0)"
      elif (algae_name == "Nannochloropsis"):
        legend = "rgb(255, 255, 0)"
        
      return_HTTP['legend'].update({algae_name: legend})

      # Persentase
      persentase = value/num_algae * 100
      persentase = round(persentase, 2)
      return_HTTP['persentase'].update({algae_name: persentase})

  else:
    image_encode = cv2.imencode('.jpg', cv2.cvtColor(image, cv2.COLOR_RGB2BGR))[1]
    return_HTTP['imgResult'] = 'data:image/jpeg;base64,' + str(base64.b64encode(image_encode).decode("utf-8"))
    return_HTTP['status'] = 0

  return return_HTTP

@app.post('/predict/mikroskop')
async def predict_mikroskop(
  file: UploadFile = File(...) # We're also setting the default value
):
  return_HTTP = {'imgResult': '', 'status': 1, 'alga':{}, 'persentase':{}, 'legend': {}}

  # Object Detection
  image = read_file(await file.read())

  results = YOLO_MIKROSKOP(image, size=640)
  results.print()
  image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
  image_result = image.copy()
  det_result = results.xyxy[0]
  cropped_img = []
  coordinate_object = []

  if len(det_result) != 0:
    for obj in det_result: # Loop sejumlah objek yang dideteksi
      xMin = int(obj[0])
      yMin = int(obj[1])
      xMax = int(obj[2])
      yMax = int(obj[3])

      coordinate_object.append([xMin, yMin, xMax, yMax])

      crop = image[yMin:yMax, xMin:xMax]
      crop = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
      cropped_img.append(crop)

    # Classification
    images = []
    for img in cropped_img:
      image = tf.image.resize(img, [75,75], tf.image.ResizeMethod.NEAREST_NEIGHBOR)
      image = np.array(image)
      images.append(image)

    prediction = MODEL_MIKROSKOP.predict(np.array(images))
    result = [CLASS_NAMES_MIKROSKOP[i] for i in np.argmax(prediction, axis=1)]
    x = 0
    # print(coordinate_object)
    print(result)
    for alga in result:
      if (alga == "Green Algae"):
        cv2.rectangle(image_result, (coordinate_object[x][0], coordinate_object[x][1]), (coordinate_object[x][2], coordinate_object[x][3]), (0, 255, 0), 1)
      elif (alga == "Blue Green Algae"):
        cv2.rectangle(image_result, (coordinate_object[x][0], coordinate_object[x][1]), (coordinate_object[x][2], coordinate_object[x][3]), (255, 0, 0), 1)
      elif (alga == "Diatom"):
        cv2.rectangle(image_result, (coordinate_object[x][0], coordinate_object[x][1]), (coordinate_object[x][2], coordinate_object[x][3]), (0, 0, 255), 1)
      elif (alga == "Euglenozoa"):
        cv2.rectangle(image_result, (coordinate_object[x][0], coordinate_object[x][1]), (coordinate_object[x][2], coordinate_object[x][3]), (0, 255, 255), 1)
      elif (alga == "Dinoflagellata"):
        cv2.rectangle(image_result, (coordinate_object[x][0], coordinate_object[x][1]), (coordinate_object[x][2], coordinate_object[x][3]), (255, 0, 255), 1)
      x += 1
    _, buffer = cv2.imencode('.jpg', image_result)

    # To see, add : data:image/jpeg;base64,
    return_HTTP['imgResult'] = 'data:image/jpeg;base64,' + str(base64.b64encode(buffer).decode("utf-8"))

    total_algaes = len(result)
    result = dict(Counter(result))

    for k, v in result.items(): #k = Jenis Alga, v = Jumlah
      return_HTTP['alga'].update({str(k): v})
      return_HTTP['persentase'].update({str(k): round(v/total_algaes*100, 2)})

      if (str(k) == "Green Algae"):
        return_HTTP['legend'].update({str(k): "rgb(0, 255, 0)"})
      elif (str(k) == "Blue Green Algae"):
        return_HTTP['legend'].update({str(k): "rgb(0, 0, 255)"})
      elif (str(k) == "Diatom"):
        return_HTTP['legend'].update({str(k): "rgb(255, 0, 0)"})
      elif (str(k) == "Euglenozoa"):
        return_HTTP['legend'].update({str(k): "rgb(255, 255, 0)"})
      elif (str(k) == "Dinoflagellata"):
        return_HTTP['legend'].update({str(k): "rgb(255, 0, 255)"})
  else:
    _, buffer = cv2.imencode('.jpg', image)
    # # To see, add : data:image/jpeg;base64,
    return_HTTP['imgResult'] = 'data:image/jpeg;base64,' + str(base64.b64encode(buffer).decode("utf-8"))
    return_HTTP['status'] = 0

  return return_HTTP

def read_file_as_image_and_normalization(data) -> np.ndarray:
  image_1 = Image.open(BytesIO(data)).convert('RGB')
  image_2 = image_1.resize((75, 75))
  image = np.array(image_2)
  return image

def read_file(data) -> np.ndarray:
  image = Image.open(BytesIO(data)).convert('RGB')
  image = np.array(image)
  return image

if __name__ == "__main__":
  uvicorn.run("main:app", host='0.0.0.0', port=8000, reload=True)