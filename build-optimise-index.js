const fs = require('fs');
fs.readFile('dist/index.html', 'utf8', function(err, contents) {
  console.log(contents);

  // Regex 
  // <script type="text/javascript" src="runtime.ec2944dd8b20ec099bf3.js"></script>
  // <script type="text/javascript" src="polyfills.815f17ba0413786bee7e.js"></script>
  // <script type="text/javascript" src="main.40a19f3c44af4680a798.js"></script>

  // Do main, then polyfills, then runtime to avoid issues with any of these JS
  // files potentially including the name of the other JS files.

  const mainRegex = /src="main\.[0-9a-f]+.js">/;
  const mainString = contents.match(mainRegex)[0];
  const mainFileName = (mainString.split('src="')[1]).split('">')[0];
  console.log(mainFileName);

  const polyfillsRegex = /src="polyfills\.[0-9a-f]+.js">/;
  const polyfillsString = contents.match(polyfillsRegex)[0];
  const polyfillsFileName = (polyfillsString.split('src="')[1]).split('">')[0];
  console.log(polyfillsFileName);

  const runtimeRegex = /src="runtime\.[0-9a-f]+.js">/;
  const runtimeString = contents.match(runtimeRegex)[0];
  const runtimeFileName = (runtimeString.split('src="')[1]).split('">')[0];
  console.log(runtimeFileName);


  fs.readFile('dist/' + mainFileName, 'utf8', function(err1, mainContents) {
    fs.readFile('dist/' + polyfillsFileName, 'utf8', function(err2, polyfillsContents) {
      fs.readFile('dist/' + runtimeFileName, 'utf8', function(err3, runtimeContents) {
        let updated = contents;
        // mainContents = 'javascript1';
        // polyfillsContents = 'javascript2';
        // runtimeContents = 'javascript3';
        console.log(runtimeContents);
        updated = updated.replace(mainString, '>' + mainContents);
        updated = updated.replace(polyfillsString, '>' + polyfillsContents);
        updated = updated.replace(runtimeString, '>' + runtimeContents);
        fs.writeFile('dist/index.html', updated, function(err4, result) {
          if (err1 || err2 || err3 || err4) {
            console.log('Errors');
            console.log(err1);
            console.log(err2);
            console.log(err3);
            console.log(err4);
          }
        });
        // console.log(updated);
      });
    });
  });
});
console.log('after calling readFile');
