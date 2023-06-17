import { imageMap } from "./ImageMap";
import { useParams } from "react-router-dom";

function ImagePairs(props) {
  console.log(imageMap);

  const params = useParams();
  const { handleClick } = props;
  //Use "/" as the default category if params.category is undefined
  const images = imageMap[params.category || "/"];
  console.log(params.category);
  //clog images
  //clog imagePair
  //image-pair class is the group of two images

  return (
    <div className="container">
      <div className="row">
        {images.map((col, colIndex) => {
          return (
            <div className="col-md-4" key={`col-${colIndex}`}>
              {col.map((imagePair, pairIndex) => {
                return (
                  <ImagePair images={imagePair} handleClick={handleClick}key={`imagePair-${colIndex}-${pairIndex}`}/>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
const ImagePair = props => {
  const { images, handleClick } = props;
  return (
    <div className="row" onClick={() => handleClick(images)}>
      {images.map((imageObject, index) => {
        const key = imageObject.url + index;
        return (
          <div className="col-6 d-flex justify-content-center" key={key}>
            <img src={imageObject.url} alt={imageObject.alt} className="img-fluid m-1" data-bs-toggle="modal" data-bs-target="#imagePreview" />
          </div>
        );
      })}
    </div>
  );
}

export default ImagePairs;
