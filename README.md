# Classroom rocket scientist

Become a classroom rocket scientist.


## Updating

On [previous projects](http://chrisnorth.github.io/design-a-space-telescope/#) we'd allowed for different languages and levels. To make it work off-line, we'd rather lazily used AJAX to load much of the content that changed. It is better to have the content in the page so this time we've taken a different approach. The configuration is still in `json` but language is stored in `yaml` which should make is easier to read for those who end up translating. Some `perl scripts` build the final `json` and use HTML templates containing pseudo SSI code to re-build the pages.

To update everything, run the shell script:

    ./regenerate.sh

Alternatively, you can update individual parts.

### HTML

The HTML is created from the `templates` directory so edit the files in there not the live files. The templates contain SSI-like commands as these are comments so don't display in a browser if they remain unparsed. The `perl` script reads the `yaml` and `json` files and uses these to process the templates. Variables, includes, and a basic for loop have been implemented as these are enough to get the job done. An HTML page is created for the front page and each of the three levels. Potentially, a version of each of these could be created for each language that exists; the filename could have the language code appended (not currently implemented).

To regenerate the static HTML there is a `perl` script:

	perl config/template.pl -mode beginner templates/index.html index.html

	perl config/template.pl -mode beginner templates/level.html beginner.html
	perl config/template.pl -mode intermediate templates/level.html intermediate.html
	perl config/template.pl -mode advanced templates/level.html advanced.html

### CSS

We use [SASS](http://sass-lang.com/documentation/file.SASS_REFERENCE.html#using_sass) for the CSS as this gives re-useable variables and makes it easier to add all the browser prefixes. So, any changes to the CSS should be done in the `css/style.scss` file and the files referenced from that (e.g. in the `tests/` directory for satellites and orbits). The main `css/style.css` file can be regenerated using:

	sass css/style.scss css/style.css

### JSON

The `json` files are created from the language files and a template for each level.

    perl config/config.pl