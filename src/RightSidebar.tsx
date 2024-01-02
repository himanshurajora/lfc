import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { Image } from 'primereact/image';

export const RightSidebar = () => {
  return (
    <div className="w-1/5 bg-slate-100 min-h-[90vh] max-h-[90vh] rounded-l-lg p-4 flex flex-col gap-2 overflow-auto">
      <div className="card">
        <Card title="Sponsors">
          <p className="m-0">@himanshurajora</p>
        </Card>
      </div>
      <div className="card">
        <Card title="Promotions">
          <div className="flex flex-col justify-center">
            <p className="m-0"> Place your Advertisement here</p>
            <Image
              className="mt-3 flex justify-center items-center"
              src="/logo.png"
              alt="Image"
              width="100"
              preview
            />
          </div>
          <Divider />
          <a className="break-words" href="mailto:contact@himanshujangid.com">
            contact@himanshujangid.com
          </a>
        </Card>
      </div>
    </div>
  );
};
