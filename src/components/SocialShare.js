import {
    FacebookMessengerShareButton,
    FacebookMessengerIcon,
    TelegramShareButton,
    TelegramIcon,
    TwitterShareButton,
    TwitterIcon,
    WhatsappShareButton,
    WhatsappIcon
}from "react-share";
  //future:add sharing functionality. url has to be image pair url. maybe modal url
function SocialShare() {
  return (
    <div className="social-container">
      <h3>Share:</h3>
      <div>
      <FacebookMessengerShareButton
        url={"http://localhost:3000/"}
        appId={'add app id'}
        quote={'Dummy text!'}
        hashtag="#muo"
      >
        <FacebookMessengerIcon size={40} round />
      </FacebookMessengerShareButton>

      <TwitterShareButton
  url={'http://localhost:3000/'}
  quote={'Dummy text!'}
  hashtag="#muo"
>
  <TwitterIcon size={40} round />
</TwitterShareButton>

<TelegramShareButton
  url={'https://www.example.com'}
  quote={'Dummy text!'}
  hashtag="#muo"
>
  <TelegramIcon size={40} round />
</TelegramShareButton>

<WhatsappShareButton
  url={'https://www.example.com'}
  quote={'Dummy text!'}
  hashtag="#muo"
>
  <WhatsappIcon size={40} round />
</WhatsappShareButton>
    </div>
    </div>
  );
}
export default SocialShare;