#!/usr/bin/perl

$settings = "settings.txt";
$convert = "convert";
$svgdir = "images/svg/";
$pngdir = "images/png/";

# Load settings
if(-e $settings){
	open(FILE,$settings);
	@lines = <FILE>;
	close(FILE);
	foreach $line (@lines){
		$line =~ s/[\n\r]//g;
		$line =~ s/\s+/\t/;
		$line =~ s/\#.*$//g;	# remove comments
		($key,$value) = split(/\t/,$line);
		if($key eq "imagemagick"){ $convert = $value; }
		if($key eq "svgdir"){ $svgdir = $value; }
		if($key eq "pngdir"){ $pngdir = $value; }
	}
}

# Check if convert is set up with the support we need
$canconvertsvg = 0;
@lines = `$convert -version`;
foreach $line (@lines){
	if($line =~ /Delegates .* rsvg( |$)/){ $canconvertsvg = 1; }
}
if(!$canconvertsvg){
	print "Your version of ImageMagick (convert) hasn't been compiled with RSVG support.\n";
	print "Try installing rsvg e.g. (Mac OSX)\n";
	print "\tbrew remove imagemagick\n";
	print "\tbrew install imagemagick --with-librsvg\n";
	print "You'll need homebrew for these example commands to work. If you don't use homebrew or have a different OS, you'll need to work out how to reinstall ImageMagick yourself with RSVG support.\n";
	print "\nCowardly exiting.\n";
	exit;
}


# Open the svg directory and work out which images we need to process
opendir($dh,$svgdir);
while(my $file = readdir $dh) {
	if($file =~ /^.*.svg$/){
		push(@files,$file);
	}
}
closedir($dh);

print "Converting svg images:\n";
foreach $file (@files){
	$png = $file;
	$png =~ s/\.svg$/\.png/;
	print "\t$svgdir$file -> $pngdir$png\n";
	`$convert $svgdir$file $pngdir$png`;
}
