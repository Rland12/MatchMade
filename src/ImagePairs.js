function ImagePairs(props) {
  const {images}=props;
  //clog images
  //clog imagePair
  
  //image-pair class is the group of two images
  return (
    <div className="container">
      <div class="row">
        <div class="col-md-4">
          <div class="row">
            {images.map(((imagePair)=>{
              
              // console.log(images);
              // console.log(imagePair);
              return(
                <div class="col-6 d-flex justify-content-center">
                  {imagePair.map(imageObject=>{
                    return(
                      <img src={imageObject.url}alt={imageObject.alt}class="img-fluid m-1"/>
                    )
                  })}
                </div>
              )
            }))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImagePairs;
