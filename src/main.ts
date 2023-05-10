import { shell } from "@tauri-apps/api";
import { convertFileSrc, invoke } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window";

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
        console.log('File path by mime:', pathName);

        let apiPath = convertFileSrc(pathName)

        const item = document.createElement('div');
        item.className = 'item';
        waterfall.appendChild(item);
        const img = document.createElement('img');
        img.src = apiPath;
        item.appendChild(img);

        item.addEventListener('dblclick', () => {
          console.log('双击了', pathName);
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

          menu.appendChild(option1);
          menu.appendChild(option2);
          document.body.prepend(menu);

          option1.addEventListener('click', () => {
              // 点击选项1时执行操作
              document.body.removeChild(menu);
              console.log('点击了', option1.getAttribute('value'));
              shell.open("file://" + option1.getAttribute('value'));
          });

          option2.addEventListener('click', () => {
              // 点击选项2时执行操作 
              document.body.removeChild(menu);
              console.log('点击了', option2.getAttribute('value'));
              // shell.open("file://" + option2.getAttribute('value'));
              invoke("cmd_explorer", {pathName: option2.getAttribute('value')});
          });

          menu.style.left = e.clientX + 'px';
          menu.style.top = e.clientY + 'px';
          console.log("pageX:", e.clientX, "pageY:", e.clientY);
      }
      });
    })
  } else {
    console.log('File drop cancelled');
  }
 });

window.addEventListener("DOMContentLoaded", () => {
  // greetInputEl = document.querySelector("#greet-input");
  // greetMsgEl = document.querySelector("#greet-msg");
  // document
  //   .querySelector("#greet-button")
  //   ?.addEventListener("click", () => greet());
});
