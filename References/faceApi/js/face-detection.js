const webcamElement = document.getElementById('webcam');

const webcam = new Webcam(webcamElement, 'user');
const modelPath = 'models';
let currentStream;
let displaySize;
let convas;
let faceDetection;


$("#webcam-switch").change(function () {
  if(this.checked){
      webcam.start()
          .then(result =>{
             cameraStarted();
             webcamElement.style.transform = "";
             console.log("webcam started");
          })
          .catch(err => {
              displayError();
          });
  }
  else {        
      cameraStopped();
      webcam.stop();
      console.log("webcam stopped");
  }        
});

$('#cameraFlip').click(function() {
    webcam.flip();
    webcam.start()
    .then(result =>{ 
      webcamElement.style.transform = "";
    });
});

$("#webcam").bind("loadedmetadata", function () {
  displaySize = { width:this.scrollWidth, height: this.scrollHeight }
});

$("#detection-switch").change(function () {
  if(this.checked){
    $(".loading").removeClass('d-none');
    Promise.all([
      faceapi.nets.ssdMobilenetv1.load(modelPath),
      faceapi.nets.faceLandmark68Net.load(modelPath),
      console.log(faceapi.nets)
    ]).then(function(){
      createCanvas();
      startDetection();
    })
  }
  else {
    clearInterval(faceDetection);
    if(typeof canvas !== "undefined"){
      setTimeout(function() {
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
      }, 1000);
    }
  }        
});

function createCanvas(){
  if( document.getElementsByTagName("canvas").length == 0 )
  {
    canvas = faceapi.createCanvasFromMedia(webcamElement)
    document.getElementById('webcam-container').append(canvas)
    faceapi.matchDimensions(canvas, displaySize)
  }
}

function toggleContrl(id, show){
  if(show){
    $("#"+id).prop('disabled', false);
    $("#"+id).parent().removeClass('disabled');
  }else{
    $("#"+id).prop('checked', false).change();
    $("#"+id).prop('disabled', true);
    $("#"+id).parent().addClass('disabled');
  }
}

function startDetection(){
  faceDetection = setInterval(async () => {
    const detections = await faceapi.detectAllFaces(webcamElement, new faceapi.SsdMobilenetv1Options({minConfidence: 0.5, maxResults: 1})).withFaceLandmarks(false);

    
    const resizedDetections = faceapi.resizeResults(detections, displaySize)
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    
    //faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
    try{

      var face_ratio = (resizedDetections[0].landmarks._positions[8].y-resizedDetections[0].landmarks._positions[27].y)/(resizedDetections[0].landmarks._positions[13].x-resizedDetections[0].landmarks._positions[4].x);
      var mouth_ratio = (resizedDetections[0].landmarks._positions[66].y-resizedDetections[0].landmarks._positions[62].y)/(resizedDetections[0].landmarks._positions[54].x-resizedDetections[0].landmarks._positions[48].x);
      var leftEye_ratio = (resizedDetections[0].landmarks._positions[40].y-resizedDetections[0].landmarks._positions[38].y)/(resizedDetections[0].landmarks._positions[39].x-resizedDetections[0].landmarks._positions[36].x);
      var rightEye_ratio = (resizedDetections[0].landmarks._positions[47].y-resizedDetections[0].landmarks._positions[43].y)/(resizedDetections[0].landmarks._positions[45].x-resizedDetections[0].landmarks._positions[42].x);

      //얼굴이 정면일 때
      if(face_ratio<0.94){
        if(mouth_ratio > 0.8){
          console.log("정면! You Yawned!");
        }
      }
      //얼굴이 좌우로 치우쳐져 있을 때
      else{
        if(mouth_ratio > 0.6){
          console.log("측면! You Yawned!");
        }
      }
      // if((resizedDetections[0].landmarks._positions[62].y-resizedDetections[0].landmarks._positions[66].y)/(resizedDetections[0].landmarks._positions[48].x-resizedDetections[0].landmarks._positions[54].x))
      // extractData
      //입 ratio
      /*
      console.log((resizedDetections[0].landmarks._positions[66].y-resizedDetections[0].landmarks._positions[62].y)/(resizedDetections[0].landmarks._positions[54].x-resizedDetections[0].landmarks._positions[48].x));
      //눈 ratio
      console.log("abc"+(resizedDetections[0].landmarks._positions[40].y-resizedDetections[0].landmarks._positions[38].y)/(resizedDetections[0].landmarks._positions[39].x-resizedDetections[0].landmarks._positions[36].x))
      console.log("def"+(resizedDetections[0].landmarks._positions[47].y-resizedDetections[0].landmarks._positions[43].y)/(resizedDetections[0].landmarks._positions[45].x-resizedDetections[0].landmarks._positions[42].x))


      console.log("얼굴 세로/가로 : "+(resizedDetections[0].landmarks._positions[8].y-resizedDetections[0].landmarks._positions[27].y)/(resizedDetections[0].landmarks._positions[13].x-resizedDetections[0].landmarks._positions[4].x));
      */
    }catch{

    }
  
    
    if(!$(".loading").hasClass('d-none')){
      $(".loading").addClass('d-none')
    }
  }, 100)
}

function cameraStarted(){
  toggleContrl("detection-switch", true);
  $("#errorMsg").addClass("d-none");
  if( webcam.webcamList.length > 1){
    $("#cameraFlip").removeClass('d-none');
  }
}

function cameraStopped(){
  toggleContrl("detection-switch", false);
  $("#errorMsg").addClass("d-none");
  $("#cameraFlip").addClass('d-none');
}

function displayError(err = ''){
  if(err!=''){
      $("#errorMsg").html(err);
  }
  $("#errorMsg").removeClass("d-none");
}



