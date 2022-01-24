var canvasSrc = document.getElementById("canvas");
var canvasRes = document.getElementById("resultado");
var canvasSobel = document.getElementById("sobel");

var ctxSrc = canvasSrc.getContext("2d");
var ctxRes = canvasRes.getContext("2d");
var ctxSobel = canvasSobel.getContext("2d");
var uploadedFile = document.getElementById("uploaded-file");

//#region Kernels
// Axis detection kernel
var axisDetKernel = [
  [-1, -1, -1],
  [-1, 8, -1],
  [-1, -1, -1]];

//Focus kernel
var focusKernel = [
  [0, -1, 0],
  [-1, 5, -1],
  [0, -1, 0]];

//Sobel
var verticalSobel = [
  [-1, 0, 1],
  [-2, 0, 2],
  [-1, 0, 1]];
var horizontalSobel = [
  [-1, -2, -1],
  [0, 0, 0],
  [1, 2, 1]];

var sobelThreshold = 40;
//#endregion


//#region Load image
window.addEventListener("DOMContentLoaded", initImageLoader);

function initImageLoader() {
  var location = window.location.href.replace(/\/+$/, "");
  // loadFile(location + "/image.png");

  // File selector
  uploadedFile.addEventListener("change", handleManualUploadedFiles);

  function handleManualUploadedFiles(ev) {
    var file = ev.target.files[0];
    handleFile(file);
  }
}
function handleFile(file) {
  var imageType = /image.*/;

  if (file.type.match(imageType)) {
    var reader = new FileReader();

    reader.onloadend = function (event) {
      var tempImageStore = new Image();

      //Setup onload function
      tempImageStore.onload = function (ev) {
        //Gets image size and adjust canvas
        canvasSrc.height = ev.target.height;
        canvasSrc.width = ev.target.width;

        // Draw image in canvas
        ctxSrc.drawImage(ev.target, 0, 0);

        // Redraw B&W
        blackAndWhite();


        // Draw result image
        // Pass the desired kernel
        convolution(canvasSrc, canvasRes, focusKernel);

        //Sobel
        drawSobel(canvasSrc, canvasSobel, verticalSobel, horizontalSobel);

      };

      tempImageStore.src = event.target.result;
    };

    reader.readAsDataURL(file);
  }
}

function imageLoaded() {

}
//#endregion

//#region Image processing
function blackAndWhite() {

  var imgData = ctxSrc.getImageData(0, 0, canvasSrc.width, canvasSrc.height);
  var pixels = imgData.data;
  // console.log(imgData);
  // console.log(pixeles);

  //imageData keeps pixeles in an array.
  //Every 4 positions corresponds to red, green, blue and alpha

  for (var p = 0; p < pixels.length; p += 4) {
    var rojo = pixels[p];
    var verde = pixels[p + 1];
    var azul = pixels[p + 2];
    var alpha = pixels[p + 3];

    var gris = (rojo + verde + azul) / 3;

    pixels[p] = gris;
    pixels[p + 1] = gris;
    pixels[p + 2] = gris;
  }

  ctxSrc.putImageData(imgData, 0, 0);
}

function convolution(originCanvas, destCanvas, kernel) {
  var imgDataSrc = ctxSrc.getImageData(0, 0, originCanvas.width, originCanvas.height);
  var pixelsSrc = imgDataSrc.data;

  canvasRes.width = canvasSrc.width;
  canvasRes.height = canvasSrc.height;

  var imgDataDes = ctxRes.getImageData(0, 0, destCanvas.width, destCanvas.height);
  var pixelsDes = imgDataDes.data;

  //Kernel weight
  var weight = 0;
  for (var x = 0; x < 3; x++) {
    for (var y = 0; y < 3; y++) {
      weight += kernel[x][y];
    }
  }

  //Iterate to apply kernel
  for (var y = 1; y < originCanvas.height - 1; y++) {
    for (var x = 1; x < originCanvas.width - 1; x++) {
      // Position in array
      var idx = ((y * originCanvas.width) + x) * 4;

      var cell1 = kernel[0][0] * pixelsSrc[((((y - 1) * originCanvas.width) + (x - 1)) * 4)];
      var cell2 = kernel[0][1] * pixelsSrc[((((y - 1) * originCanvas.width) + (x)) * 4)];
      var cell3 = kernel[0][2] * pixelsSrc[((((y - 1) * originCanvas.width) + (x + 1)) * 4)];
      var cell4 = kernel[1][0] * pixelsSrc[((((y) * originCanvas.width) + (x - 1)) * 4)];
      var cell5 = kernel[1][1] * pixelsSrc[((((y) * originCanvas.width) + (x)) * 4)];
      var cell6 = kernel[1][2] * pixelsSrc[((((y) * originCanvas.width) + (x + 1)) * 4)];
      var cell7 = kernel[2][0] * pixelsSrc[((((y + 1) * originCanvas.width) + (x - 1)) * 4)];
      var cell8 = kernel[2][1] * pixelsSrc[((((y + 1) * originCanvas.width) + (x)) * 4)];
      var cell9 = kernel[2][2] * pixelsSrc[((((y + 1) * originCanvas.width) + (x + 1)) * 4)];

      var result = cell1 + cell2 + cell3 + cell4 + cell5 + cell6 + cell7 + cell8 + cell9;
      if (weight != 0) result = result / weight;

      pixelsDes[idx] = result;  //red
      pixelsDes[idx + 1] = result;  //green
      pixelsDes[idx + 2] = result;  //blue
      pixelsDes[idx + 3] = 255; //alpha
    }
  }
  ctxRes.putImageData(imgDataDes, 0, 0);
}

function drawSobel(originCanvas, destCanvas, vKernel, hKernel) {
  var imgDataSrc = ctxSrc.getImageData(0, 0, originCanvas.width, originCanvas.height);
  var pixelsSrc = imgDataSrc.data;

  canvasSobel.width = canvasSrc.width;
  canvasSobel.height = canvasSrc.height;

  var imgDataDes = ctxSobel.getImageData(0, 0, destCanvas.width, destCanvas.height);
  var pixelsDes = imgDataDes.data;

  for (var y = 1; y < originCanvas.height - 1; y++) {
    for (var x = 1; x < originCanvas.width - 1; x++) {
      var idx = ((y * originCanvas.width) + x) * 4;


      var totalX = 0;
      var totalY = 0;
      for (var kernelY = 0; kernelY < 3; kernelY++) {
        for (var kernelX = 0; kernelX < 3; kernelX++) {
          totalY += vKernel[kernelY][kernelX] * pixelsSrc[((((y + (kernelY - 1)) * originCanvas.width) + (x + (kernelX - 1))) * 4)];
          totalX += hKernel[kernelY][kernelX] * pixelsSrc[((((y + (kernelY - 1)) * originCanvas.width) + (x + (kernelX - 1))) * 4)];

        }
      }

      //Magnitud
      // var mag = Math.sqrt(hResult * hResult + vResult * vResult);
      var mag = Math.sqrt(totalX * totalX + totalY * totalY);
      mag = (mag < sobelThreshold) ? 0 : mag; //Apply threshold

      pixelsDes[idx] = mag;  //red
      pixelsDes[idx + 1] = mag;  //green
      pixelsDes[idx + 2] = mag;  //blue
      pixelsDes[idx + 3] = 255; //alpha

    }
  }

  ctxSobel.putImageData(imgDataDes, 0, 0);

}

//#endregion
