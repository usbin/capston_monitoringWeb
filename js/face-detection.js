const webcamElement = document.getElementById('webcam');

const webcam = new Webcam(webcamElement, 'user');
const modelPath = 'models';
let currentStream;
let displaySize;
let convas;
let faceDetection;


// $.ajax({
//   type: 'POST',
//   url: '/',
//   data: {data : data},
//   success: success,
//   dataType: 'json'
// });


// function sendPost(value) {
// 	var xhr = new XMLHttpRequest();
//   xhr.open("POST", yourUrl, true);
//   xhr.setRequestHeader('Content-Type', 'application/json');
//   xhr.send(JSON.stringify({
//     value: value
// }));
// }
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
    clearInterval(send);
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
  var yawnQueue = new Queue(20);
  var periodStarted = false;
  faceDetection = setInterval(async () => {
    
    const detections = await faceapi.detectAllFaces(webcamElement, new faceapi.SsdMobilenetv1Options({minConfidence: 0.5, maxResults: 1})).withFaceLandmarks(false);

    
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    
    //faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    try{
      //ajax.data = "abc?!";
      // $.post('http://localhost:3001/', {value:"abc?!"}, function(data){
      //   console.log(data);
      // });
      

      var mouth_ratio = (resizedDetections[0].landmarks._positions[66].y-resizedDetections[0].landmarks._positions[62].y)/(resizedDetections[0].landmarks._positions[54].x-resizedDetections[0].landmarks._positions[48].x);
      // var leftEye_ratio = (resizedDetections[0].landmarks._positions[40].y-resizedDetections[0].landmarks._positions[38].y)/(resizedDetections[0].landmarks._positions[39].x-resizedDetections[0].landmarks._positions[36].x);
      // var rightEye_ratio = (resizedDetections[0].landmarks._positions[47].y-resizedDetections[0].landmarks._positions[43].y)/(resizedDetections[0].landmarks._positions[45].x-resizedDetections[0].landmarks._positions[42].x);
      var betweenLeftEndAndNose = (resizedDetections[0].landmarks._positions[30].x-resizedDetections[0].landmarks._positions[2].x);
      var betweenRightEndAndNose = (resizedDetections[0].landmarks._positions[14].x-resizedDetections[0].landmarks._positions[30].x);

      //주기가 시작된 상태면 (1)현재 시각을 큐에 집어넣고 (2)큐가 꽉 찼을 때 체크 후 (3) 큐를 비움.
      let isDetected = ((betweenLeftEndAndNose*2<betweenRightEndAndNose)&&(mouth_ratio > 0.4)) //왼쪽 yawned
      ||((betweenRightEndAndNose*2<betweenLeftEndAndNose)&&(mouth_ratio > 0.4)) //오른쪽 yawned
      ||((betweenLeftEndAndNose*2>=betweenRightEndAndNose)&&(betweenRightEndAndNose*2>=betweenLeftEndAndNose)&&(mouth_ratio > 0.6));
      //주기가 시작되지 않았을 때+감지됨 => 주기 시작하고 큐에 저장.
      if(!periodStarted && isDetected){
        yawnQueue.enqueue(new DetectedData(true, new Date()));
        periodStarted = true;
      }
      //주기가 시작됨+감지됨+큐가 꽉 차지 않음. => 큐에 저장.
      else if(periodStarted && yawnQueue.store.length < yawnQueue.size){
        yawnQueue.enqueue(new DetectedData(isDetected, new Date()));
      }
      //큐가 꽉 참.
      else if(yawnQueue.store.length >= yawnQueue.size){
        if(isRealYawned(yawnQueue)){
          //최초 시각 전송.
          yawnTime = yawnQueue.dequeue().time;
          $.ajax({
            method: 'POST',
            url: '/',
            data: {tag: 'yawnTime', userId: '0x00000000', data : yawnTime},
            dataType: 'text',
            cache:false,
            async:false,
            success: function(){
              console.log("data send success.");
            },
            error:function(){
              console.log("data send error.");
            }
          });
        }
        yawnQueue = new Queue(20);
        periodStarted = false;
      }

      //console.log("l: "+betweenLeftEndAndNose+"\nr: "+betweenRightEndAndNose);

      // else if(betweenRightEndAndNose*2<betweenLeftEndAndNose){
      //   if(mouth_ratio > 0.4){
      //     console.log("오른쪽! You Yawned!");
      //     yawnQueue.enqueue(new Date());
      //   }
      // }
      // //얼굴이 정면일 때
      // else{
      //   if(mouth_ratio > 0.6){
      //     console.log("정면! You Yawned!");
      //     yawnQueue.enqueue(new Date());
      //   }
      // }
     

      

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
    }catch(e){
      
      //console.log("catch!" + e);
    }
  
    
    if(!$(".loading").hasClass('d-none')){
      $(".loading").addClass('d-none')
    }
  }, 200);
  // send = setInterval(async ()=>{
  //   now = new Date();
  //   $.ajax({
  //     method: 'POST',
  //     url: '/',
  //     data: {data : now},
  //     dataType: 'text',
  //     cache:false,
  //     async:false,
  //     success: function(){
  //       console.log("send date success!");
  //     },
  //     error:function(){
  //       console.log("send date error!");
  //     }
  //   });
  //   console.log(now);

  // }, 3000);
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
//20회 중 연속된 10회의 감지 안에서 하품이 7회 이상일 경우 => 10개 구간의 평균이 0.7 이상일 경우, true를 리턴.
function isRealYawned(queue){
  var dend = 0;
  var dsor = 10;
  for(i=0; i<queue.store.length-15; i++){
    dend=0;
    for(j=15+i-1; j>=i; j--){
      if(queue.get(j).flag){
        dend += 1
      }
    }
    if(dend/dsor >= 0.7){
      return true;
    }
  }
  return false;
}

class Queue {
  constructor(size){
    this.store = [];
    this.size = size;
  }
  enqueue(item){
    this.store.push(item);
    if(this.store.length > this.size){
      return false;
    }
    console.log("현재 store : "+this.store.length);
    return true;
  }
  dequeue(){
    return this.store.shift();
  }
  get(i){
    return this.store[i];
  }
}
class DetectedData{
  constructor(flag, time){
    this.flag = flag;
    this.time = time;
  }
}