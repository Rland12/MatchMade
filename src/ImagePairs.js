function ImagePairs(props) {
  const {images}=props;
  //clog images
  //clog imagePair
  
  //image-pair class is the group of two images
  return (
    <div className="container">
      <div className="row">
        {images.map((col)=>{
          return(
            <div className="col-md-4">
              {col.map((imagePair)=>{
                  //console.log(images);
                  //console.log(imagePair);
                return(
                  <div className="row">
                    {imagePair.map(imageObject=>{
                      return(
                        <div className="col-6 d-flex justify-content-center">
                        <img src={imageObject.url}alt={imageObject.alt}className="img-fluid m-1"/>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )
        })}  
      </div>
    </div>
  );
}

export default ImagePairs;
