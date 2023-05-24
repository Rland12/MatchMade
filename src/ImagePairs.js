function ImagePairs(props) {
  const {images}=props;
  //clog images
  //clog imagePair
  
  //image-pair class is the group of two images
  return (
    <div className="container">
      <div class="row">
        <div class="col-md-4">
          
            {images.map(((imagePair)=>{
              
              // console.log(images);
              // console.log(imagePair);
              return(
                <div class="row">
                  {imagePair.map(imageObject=>{
                    return(
                      <div class="col-6 d-flex justify-content-center">
                      <img src={imageObject.url}alt={imageObject.alt}class="img-fluid m-1"/>
                      </div>
                    )
                  })}
                </div>
              )
            }))}
          
        </div>
      </div>
    </div>
  );
}

export default ImagePairs;
