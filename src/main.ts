import { shell } from "@tauri-apps/api";
import { convertFileSrc, invoke } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window";
import { writeText } from '@tauri-apps/api/clipboard';

await appWindow.onFileDropEvent((event) => {
  if (event.payload.type === 'hover') {
    console.log('User hovering', event.payload.paths);
  } else if (event.payload.type === 'drop') {
    console.log('User dropped', event.payload.paths);
    event.payload.paths.forEach(async (path) => {
      console.log('File path:', path);
      let paths: string[] = await invoke('path_by_mime', { pathName: path });
      
      document.querySelector('.waterfall')?.remove();
      const waterfall = document.createElement('div');
      document.body.appendChild(waterfall);
      waterfall.className = 'waterfall';

      paths.forEach(pathName => {
        let apiPath = convertFileSrc(pathName)

        const item = document.createElement('div');
        item.className = 'item';
        waterfall.appendChild(item);
        const img = document.createElement('img');
        img.src = apiPath;
        item.appendChild(img);
        // 给图片添加路径名称
        const text = document.createElement('div');
        text.className = 'img-path-name';
        text.textContent = pathName;
        item.appendChild(text);

        item.addEventListener('click', (e) => {
          e.stopPropagation();
          document.body.querySelector('.custom-menu')?.remove();
        });

        item.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          shell.open("file://" + pathName);
        });

        img.oncontextmenu = function (e) {
          e.preventDefault();
          console.log(e);
          document.body.querySelector('.custom-menu')?.remove();
          const menu = document.createElement('div');
          menu.classList.add('custom-menu');
          const option1 = document.createElement('div');
          option1.textContent = '打开图片';
          option1.classList.add('menu-option');
          option1.setAttribute('value', pathName);

          const option2 = document.createElement('div');
          option2.textContent = '跳转目录';
          option2.classList.add('menu-option');
          // 截取文件路径的目录
          // option2.setAttribute('value', pathName.substring(0, pathName.lastIndexOf('\\')));
          option2.setAttribute('value', pathName);

          const option3 = document.createElement('div');
          option3.textContent = '取色器';
          option3.classList.add('menu-option');

          menu.appendChild(option1);
          menu.appendChild(option2);
          menu.appendChild(option3);
          document.body.prepend(menu);

          option1.addEventListener('click', () => {
              // 点击选项1时执行操作
              e.stopPropagation();
              document.body.removeChild(menu);
              shell.open("file://" + option1.getAttribute('value'));
          });

          option2.addEventListener('click', (e) => {
              // 点击不传递点击事件
              e.stopPropagation();
              // 点击选项2时执行操作 
              document.body.removeChild(menu);
              invoke("cmd_explorer", {pathName: option2.getAttribute('value')});
          });

          option3.addEventListener('click', async (e) => {
            e.stopPropagation();
            document.body.removeChild(menu);
            // 调用系统的取色器
            // @ts-ignore
            const eyeDropper = new EyeDropper();
            const eyeDropperOpen = await eyeDropper.open();
            await writeText(eyeDropperOpen.sRGBHex);
          });

          menu.style.left = e.clientX + 'px';
          menu.style.top = e.clientY + 'px';
      }
      });
    })
  } else {
    console.log('File drop cancelled');
  }
 });

window.addEventListener("DOMContentLoaded", () => {

});
