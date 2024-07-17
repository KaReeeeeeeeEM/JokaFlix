import { Footer } from "flowbite-react";
import { BsDribbble, BsFacebook, BsGithub, BsInstagram, BsTwitter } from "react-icons/bs";
import logo from '../assets/logo-sub.png';
export default function Component() {
  return (
    <Footer>
      <div className="w-full p-4 bg-gray-800">
        <div className="grid w-full md:px-40 md:py-8 justify-between sm:flex sm:justify-between md:flex md:grid-cols-1">
          <div className="mb-12 md:mb-0">
            <img
              href="#"
              src={logo}
              alt="JokaFlix Logo"
              className="h-20 w-20 md:h-24 md:w-24"
            />
          </div>
          <div className="grid grid-cols-2 mx-4 md:mx-0 gap-8 sm:mt-4 sm:grid-cols-3 sm:gap-6">
            <div>
              <Footer.Title title="about" />
              <Footer.LinkGroup col>
                <Footer.Link href="#">JokaFlix</Footer.Link>
                <Footer.Link href="#">Home of Movies and Series</Footer.Link>
              </Footer.LinkGroup>
            </div>
            <div>
              <Footer.Title title="Follow us" />
              <Footer.LinkGroup col>
                <Footer.Link href="#">Github</Footer.Link>
                <Footer.Link href="#">Discord</Footer.Link>
              </Footer.LinkGroup>
            </div>
            <div>
              <Footer.Title title="Legal" />
              <Footer.LinkGroup col>
                <Footer.Link href="#">Privacy Policy</Footer.Link>
                <Footer.Link href="#">Terms &amp; Conditions</Footer.Link>
              </Footer.LinkGroup>
            </div>
          </div>
        </div>
        <Footer.Divider />
        <div className="w-full px-4 md:px-40 sm:flex sm:items-center sm:justify-between">
          <Footer.Copyright href="#" by="JokaFlix | Home of Movies and Series" year={new Date().getFullYear()} />
          <div className="mt-4 flex space-x-6 sm:mt-0 sm:justify-center">
            <Footer.Icon href="#" icon={BsFacebook} />
            <Footer.Icon href="#" icon={BsInstagram} />
            <Footer.Icon href="#" icon={BsTwitter} />
            <Footer.Icon href="#" icon={BsGithub} />
            <Footer.Icon href="#" icon={BsDribbble} />
          </div>
        </div>
      </div>
    </Footer>
  );
}