let video
let faceapi
let startA = 59
let endA = 110
let startB = 140
let endB = 149
let didPlay = false
let anim
let fail
let loading
let lottie;
let isLoading = true
let prevLoc = [0,0]
let prevSize = 0

let scaleLottie = 2.5
let failedData
let loadingData
let animData
let bg;

let bounds = 85

function preload() {
  bg = loadImage('background.jpg');
  loadingData = loadJSON('loading.json')
  failedData = loadJSON('failed.json')
  
  pixelDensity(1);
}

function setup() {
  createCanvas(600, 600);
   video = createCapture(VIDEO);
   video.hide();
  
  const detectionOptions = {
    withLandmarks: true,
    withDescriptors: false,
  }
  
  faceapi = ml5.faceApi(detectionOptions, modelLoaded)
  
  failedLottie = createDiv();
  let failedParams = {
    container: failedLottie.elt,
    loop: true,
    autoplay: true,
    animationData: failedData,
    renderer: 'svg',
  };
    
  fail = bodymovin.loadAnimation(failedParams);
  failedLottie.size(min(width,height)/5, min(width,height)/5)
  failedLottie.position(-width/2, -height/2);
  
  loadingLottie = createDiv();
  let loadingParams = {
    container: loadingLottie.elt,
    loop: true,
    autoplay: true,
    animationData: loadingData,
    renderer: 'svg',
  };
    
  loading = bodymovin.loadAnimation(loadingParams);
  loadingLottie.size(min(width,height)/5, min(width,height)/5)
  loadingLottie.position(width/2 - min(width,height)/10, height/2 - min(width,height)/10);
}

function modelLoaded() {
  console.log('faceAPI ready')
}


function draw() {
  background(255);
  textAlign(CENTER)
  if (!isLoading) {
        loadingLottie.position(-width/2, -height/2)
      text("Point your head to the camera",  width/2, height/2 + height/10)
    } else {
      text("Loading machine learning model...", width/2, height/2 + height/10)
    }
  
  image(video, 0, 0, width, height);
  
  let facePos

  faceapi.detect(video, (err, results) => {
    if (!results || results.length == 0) {
      failedLottie.position(prevLoc[0], prevLoc[1]);
      failedLottie.size(prevSize,prevSize)
      return
    }
      
     failedLottie.position(-width, -height)
     isLoading = false
    
     let eyeR = results[0].parts.rightEye;
     let eyeL = results[0].parts.leftEye;
     let d = dist(eyeR[0].x, eyeR[0].y, eyeL[eyeL.length-1].x, eyeL[eyeL.length-1].y);
    
    const size = d
    prevSize = size * 10
    const midX = (eyeR[0].x + eyeL[eyeL.length-1].x)/2 -(size/2)
    const midY = (eyeR[0].y + eyeL[eyeL.length-1].y)/2 -(size/2)+ 10
     
     facePos = {
        // x: (eyeR[0].x + eyeL[eyeL.length-1].x)/2,
        // y: (eyeR[0].y + eyeL[eyeL.length-1].y)/2,
       x: results[0].parts.nose[0].x,
        y: results[0].parts.nose[0].y,
        size: size*2.5
     }
      
     const maskArr = createMask(video, [facePos.x, facePos.y+50], bounds, size*scaleLottie)
     mask(bg, maskArr)
      
     prevLoc = [facePos.x, facePos.y+50]
      const csize = min(width, height)/10
  const zoomPos = {
    x: width - csize,
    y: height/2,
    size: min(width, height)/10
  }
  
  const outPos = {
    x: csize,
    y: height/2,
    size: min(width, height)/10
  }
    
  drawCircle(zoomPos, true)
  drawCircle(outPos)
    
  if (isIntersect(zoomPos, facePos)) {
    zoom(true)
  }
    
  if (isIntersect(outPos, facePos)) {
    zoom()
  } 
  })
}
                 

function animate(obj) {
  let targetFrames = [0, 0];
    
  if (!didPlay) {
    didPlay = true;
    targetFrames = [startA, endA];
  } else {
    didPlay = false;
    targetFrames = [startB, endB]
  }
    
  anim.playSegments([targetFrames], true);
}
  
function isIntersect(o1, o2) {
    let distSq = (o1.x - o2.x) * (o1.x - o2.x) + 
                 (o1.y - o2.y) * (o1.y - o2.y); 
    let radSumSq = (o1.size/2 + o2.size/2) * 
        (o1.size/2 + o2.size/2); 
    let res = distSq > radSumSq
    
    return !res 
}
  
function createMask(img, area, bounds, size) {
  let maskArr = []
  image(img, 0, 0, width, height);
  
  loadPixels()
  
  const reducer = (accumulator, currentValue) => accumulator + currentValue;
  let boundArr = []
  for (let i = 0; i < width; i++) {
    let row = []

    for (let j = 0; j < height; j++) {
      const distance = dist(area[0], area[1], i, j)
      const idx = getIndex(i,j)
      let avg = (pixels[idx] + pixels[idx+1] + pixels[idx+2])/3
      if (distance <= size) {
        boundArr.push(avg)
        row.push(avg > bounds ? 1 : 0)
      }
    }
    
    maskArr.push(row)
  }
  
  const len = boundArr.length
  // print(boundArr.reduce(reducer),len)
  //boundArr.reduce(reducer)/len
  bounds = boundArr.reduce(reducer)/len
  
  return maskArr
}

function mask(img, maskArr) {
  // push();
  //     translate(width, height);
  //     scale(-1,1);
  //     image(img, 0, 0, width, height);
  //   pop(); 
  image(img, 0, 0, width, height);
  
  loadPixels()
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      const idx = getIndex(i,j)
      let isMask = maskArr[i][j]
      
      pixels[idx] = isMask ? 0 : pixels[idx];
      pixels[idx+1] = isMask ? 0 : pixels[idx+1];
      pixels[idx+2] = isMask ? 0 : pixels[idx+2];
      pixels[idx+3] = isMask ? 0 : 255;
    }
  }
  
  updatePixels()
}
  
function getIndex(i, j) {
  return (i + j * width) * 4
}
  
function drawCircle(obj, isZoom) {
  push()
  strokeWeight(4)
  textAlign(CENTER)
  fill(0,0,0,0)
  circle(obj.x, obj.y, obj.size)
  fill(0)
  textStyle(BOLD)
  textFont('Helvetica')
  text(isZoom ? "+" : "-", obj.x, obj.y+obj.size/10)
  pop()
}
  
function zoom(isZoom) {
  scaleLottie = isZoom ? min(10,scaleLottie*2) : max(2.5, scaleLottie/2)
}
  
function isIntersect(o1, o2) {
    let distSq = (o1.x - o2.x) * (o1.x - o2.x) + 
                 (o1.y - o2.y) * (o1.y - o2.y); 
    let radSumSq = (o1.size/2 + o2.size/2) * 
        (o1.size/2 + o2.size/2); 
    let res = distSq > radSumSq
    return !res 
}