<script>
	import {onMount} from "svelte";
	import {demoNotebook, notebookTemplate} from './demoNotebook.js';
	import {CodeJar} from 'codejar'
  import {evaluate} from 'mathjs';
	let editor, cj;
	let results = [];
	let variables = {};
	let topOffset = 0;
	let tick = 0;
	
	let notebooks = [
		{
			title: 'Demo notebook',
			content: demoNotebook,
			id: 'demo',
		}
	]
	let selectedNotebook = notebooks[0];
  $: notebook = notebooks.find(i => i.id === selectedNotebook.id).content;
	onMount(async () => {
		restoreNotebooks();
		await new Promise(r => setTimeout(r))
		const dl = throttle(console.error, 1000);
		const as = throttle(console.assert, 500);
		solve(notebook);
		cj = CodeJar(editor, highlight);
		cj.updateCode(notebook);
		setInterval(() => {
			tick++;
			tick = tick % 20;
			try {
				topOffset = document.querySelector('.inner')?.getBoundingClientRect().top;
				notebook = cj.toString();
				solve(notebook);
				let cur = cj.save();
				cj.updateCode(notebook)
				highlight(editor);
				cj.restore(cur);
				saveNotebooks();
			} catch(e){
			}
		}, 1)
		cj.onUpdate(() => {
			notebook = cj.toString();
			notebooks.find(i => i.id === selectedNotebook.id).content = cj.toString();
			saveNotebooks();
			solve(notebook);
		})
	})
	function restoreNotebooks(){
		if (localStorage.notebooks){
			notebooks = JSON.parse(localStorage.notebooks);
			selectedNotebook = notebooks[0]
			if (localStorage.selected){
				selectedNotebook = notebooks.find(i => i.id === localStorage.selected);
				if (!selectedNotebook){
					selectedNotebook = notebooks[0];
				}
			}
		}
	}
	function saveNotebooks(){
		localStorage.notebooks = JSON.stringify(notebooks);
		localStorage.selected = selectedNotebook.id;
	}
	function throttle(func, delay) {
		let lastTime = 0;
		return function(...args) {
			const currentTime = new Date().getTime();
			if (currentTime - lastTime >= delay) {
				func.apply(this, args);
				lastTime = currentTime;
			}
		};
	}
	function getParams(func){
		var ARGUMENT_NAMES = /([^\s,]+)/g;
		var STRIP_COMMENTS = /(\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s*=[^,\)]*(('(?:\\'|[^'\r\n])*')|("(?:\\"|[^"\r\n])*"))|(\s*=[^,\)]*))/mg;
		var fnStr = func.toString().replace(STRIP_COMMENTS, '');
		var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
		if(result === null)
			result = [];
		return result;
	}
	function highlight(element){
			let lines = element.innerText.split('\n');
			let output = []
			for (let line of lines){
				let current = escape(line);
				current = current.replace(/([^\/])([\/\*\+\-\^])([^\/])/g, '$1<span class="operator">$2</span>$3')
				current = current.replace(/([^_])([0-9\.]+)/g, '$1<span class="number">$2</span>')
				current = current.replace(/(\/\/.+)/g, '<span class="comment">$1</span>')
				//current = current.replace(/ (feet|foot|seconds?|minutes?|hours?|degrees?|newtons?|\$|deg|rad|radians|m\/s|m)/, ' <span class="unit">$1</span>')
				current = current.replace(/{([^}]+)}/gi, (_, g) => {
					let el = document.createElement('span');
					el.innerHTML = g;
					return `{${el.innerText}}`
				}).replace(/{([a-z0-9_]+)}/gi, (_, a) => {
			    let el = document.createElement('span');
					el.innerText = a;
					if (variables.hasOwnProperty(a)){
						el.setAttribute('data-value', formatResult(variables[a]));
					} else {
						el.classList.add('undefined')
					}
					el.classList.add('inline-variable')
					let out = el.outerHTML;
					out = `<span class="inline-variable-bracket">{</span>${out}<span class="inline-variable-bracket">}</span>`
					return out;
				})
				if (line.startsWith('#')){
					current = `<span class="header">${current}</span>`
				}
        output.push(current)
			}
			element.innerHTML = output.map((i,idx) => `<span class="line ${results[idx] == null ? '' : 'result'}" data-line=${JSON.stringify(idx)} data-result=${JSON.stringify(formatResult(results[idx] || ''))}>${i}</span>`).join('\n')
	}
	function escape(html){
		return html.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
	}
	function formatResult(result){
		if (result.toString().length === 0){
			return '0'
		}
		if (typeof result === 'function'){
			return `${result.name}(${getParams(result).filter(i => i !== 't').join(', ')})`
		}
		return result.toString().replace(/([0-9\.e\-]+)/g, (a) => {
			if (parseFloat(a, 10) < 10 && parseFloat(a, 10) === parseInt(a, 10)){
				return a.toString();
			}
			let r = parseFloat(a, 10).toFixed(2);
			if (r < 1e-11){
				return '0'
			}
			return r;
		})
	}
	
	function solve(notebook){
		let lines = notebook.split('\n').map(i => i.trim())
		
		let v2 = {};
		let out = [];
		let idx = 0;
		for (let line of lines){
			if (line.startsWith('//') || line.startsWith('#') || !line.trim().length){
				out[idx] = null;
			}
			line = line.split('//')[0];
			try {
				out[idx] = evaluate(line, v2)
			} catch(e){
				out[idx] = null;
			}
			
			idx++;
		}
		variables = {...v2}
		results = [...out];
	}
	function copy(val, msg){
		navigator.clipboard.writeText(val);
		toast(msg);
	}
	
	function toast(text, timeout = 3000) {
		let t = document.createElement("div");
		console.log(
			window.toast_time,
			Date.now(),
			Date.now() < window.toast_time,
			document.querySelector("#copy_toast")
		);
		if (Date.now() < window.toast_time && document.querySelector("#copy_toast")) {
			t = document.querySelector("#copy_toast");
			t.innerText = text;
			clearTimeout(window.toast_1_int);
			clearTimeout(window.toast_2_int);
			t.style.bottom = "3px";
			window.toast_time = Date.now() + (timeout - 600);
			window.toast_1_int = setTimeout(
				() => (t.style.bottom = "-200px"),
				timeout - 500
			);
			window.toast_2_int = setTimeout(() => t.remove(), timeout);
			return;
		} else {
			document.querySelector("#copy_toast")?.remove();
		}
		t.id = "copy_toast";
		t.setAttribute(
			"style",
			`
							position: fixed;
							bottom: -200px;
							z-index: 1000000000;
							transition: bottom .5s cubic-bezier(.44,.57,.44,1.25);
							border-radius: 1000px;
							background: #000a;
							border: 1px solid #0009;
							color: white;
							display: flex;
							justify-content: center;
							align-items: center;
							padding: 4px 15px;
							left: 50vw;
							transform: translate(-50%, -50%);
							font-family: monospace;
							width: fit-content;
							`
		);
		document.body.insertAdjacentElement("afterend", t);
		t.innerText = text;
		setTimeout(() => {
			t.style.bottom = "3px";
		}, 10);
		window.toast_time = Date.now() + (timeout - 600);
		window.toast_1_int = setTimeout(
			() => (t.style.bottom = "-200px"),
			timeout - 500
		);
		window.toast_2_int = setTimeout(() => t.remove(), timeout);
	}
	
	function createNotebook(){
     let title = prompt('Notebook title');
		 if (!title){
			 return;
		 }
		 notebooks.push({
			 id: crypto.randomUUID(),
			 content: notebookTemplate,
			 title,
		 })
		 notebooks = [...notebooks];
		 saveNotebooks();
	}
	function downloadData(){
		console.log(notebooks)
		exportFiles(notebooks.map(i => {
			return new File([i.content], i.title + '.txt', {type: 'text/plain'})
		}))
	}
	function exportFiles(fileArray, zipFileName) {
  const zip = new JSZip();
  fileArray.forEach((file) => {
    zip.file(file.name, file);
  });
  zip
    .generateAsync({ type: "blob" })
    .then((content) => {
		  console.log('Got zip', content)
      let url = URL.createObjectURL(content);
			console.log(url)
		  try {location = url;} catch(e){
				prompt('Paste this URL in your browser to download:', url)
			}
    })
    .catch((err) => {
      console.error(err);
      alert("An error occurred while generating the zip file.");
    });
	}
</script>
<svelte:head>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/mathjs/11.8.0/math.min.js"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
</svelte:head>
<div class="container">
	<div class='sidebar'>
		<h3>
			Documents
		</h3>
		<button class='create btn-style' on:click={createNotebook}>
			New notebook
		</button>
		<button class='create btn-style' on:click={() => downloadData()}>
			Export data
		</button>
		<ul class='notebooks'>
			{#each notebooks as nb}
			<li class:selected={selectedNotebook.id === nb.id} on:click={() => (selectedNotebook = notebooks.find(i => i.id === nb.id),cj.updateCode(selectedNotebook.content))}>{nb.title}</li>
			{/each}
		</ul>
	</div>
	<div class='inner'>
		<div class='codejar' bind:this={editor} on:scroll={() => tick++}></div>
		<div class='results'>
			{#each results as result,idx}
			{#if [undefined, null].includes(result)}
			{:else}
				<li on:click={() => copy(formatResult(result || ''), "Copied!")} style:top={tick.toString() === '' ? '' : (document.querySelector(`.line[data-line="${idx}"]`).getBoundingClientRect().top - topOffset)+ 'px'}><span>{formatResult(result || '')}</span></li>
			{/if}
			{/each}
		</div>
		<details class="variables">
			<summary class='open btn-style'>
				Variables:
			</summary>
			<ul class='variable_list'>
				{#each Object.entries(variables) as a}
					<li on:click={() => copy(a[1], `Copied ${a[0]} to clipboard`)}>
						<span class='varname'>{a[0]}</span>
						<span class='value'>{a[1]?.toString()}</span>
					</li>
				{/each}
			</ul>
		</details>
	</div>
</div>