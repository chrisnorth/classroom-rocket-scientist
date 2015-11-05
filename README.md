# Classroom rocket scientist

Become a classroom rocket scientist.


## Updating

### HTML

The HTML is created in the `templates` directory so edit the files in there.
To regenerate the static HTML there is a `perl` script:

	perl templates/template.pl templates/index.html index.html

### CSS

We use [SASS](http://sass-lang.com/documentation/file.SASS_REFERENCE.html#using_sass) for the CSS as this gives re-useable variables and makes it easier to add all the browser prefixes. So, any changes to the CSS should be done in the `css/style.scss` file and files referenced from that. The main `css/style.css` file can be regenerated using:

	sass css/style.scss css/style.css