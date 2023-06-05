function ImagePairs(props) {
  const { images, handleClick } = props;
  //clog images
  //clog imagePair
  //image-pair class is the group of two images
  return (
    <div className="container">
      <div className="row">
        {images.map((col) => {
          return (
            <div className="col-md-4">
              {col.map((imagePair) => {
                //console.log(images);
                //console.log(imagePair) data-bs-target="#exampleModal";
                return (
                  <ImagePair images={imagePair} handleClick={handleClick} />
                )
              })}
            </div>
          )

        })}

      </div>
    </div>

  );
}
const ImagePair = props => {
  const { images,handleClick } = props;
  return (
    <div className="row" onClick={()=> handleClick(images)}>
      {images.map(imageObject => {
        return (
          <div className="col-6 d-flex justify-content-center">
            <img src={imageObject.url} alt={imageObject.alt} className="img-fluid m-1" data-bs-toggle="modal" data-bs-target="#imagePreview"/>
          </div>
        )
      })}
    </div>
  );
}

export default ImagePairs;
