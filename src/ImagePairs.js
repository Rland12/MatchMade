function ImagePairs(props) {
  const {images}=props;
  //clog images
  //clog imagePair
  return (
    <div className="images-container">
      {images.map(((imagePair)=>{
        //clog imagePair
        return(
          <div className="image-pair">
            
            {imagePair.map(imageObject=>{
              return(
                <img src={imageObject.url}alt={imageObject.alt}/>
              )
            })}
            
        </div>
          )
      }))}
     
    </div>
  );
}

export default ImagePairs;
