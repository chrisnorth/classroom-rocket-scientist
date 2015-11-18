#!/usr/bin/perl
# SSI: http://www.w3.org/Jigsaw/Doc/User/SSI.html

use Data::Dumper;

# We need to temporarily include the base directory 
# of this perl script on the include path
BEGIN{ if($0 =~ /^(.*\/)[^\/]+/){ unshift @INC, $1 } }

# Require the common file
require('common.pl');


$basedir = "./";
if($0 =~ /^(.*\/)[^\/]+/){ $basedir = $1; }


#################################
# Process command line arguments
#################################
$overwrite = 0;
$mode = "beginner";
$lang = "en";
for($i = 0; $i < (@ARGV) ; $i++){
	if($ARGV[$i] =~ /^\-+(.*)/){
		$flag = $1;
		if($flag eq "f" || $flag eq "file"){ $file_i = $ARGV[$i+1]; }
		if($flag eq "o" || $flag eq "ofile"){ $file_o = $ARGV[$i+1]; }
		if($flag eq "l" || $flag eq "lang"){ $lang = $ARGV[$i+1]; }
		if($flag eq "m" || $flag eq "mode"){ $mode = $ARGV[$i+1]; }
		if($flag eq "overwrite"){ $overwrite = 1; $i--; }
		$i++;
	}else{
		if(!$file_i){
			$file_i = $ARGV[$i];
		}else{
			if(!$file_o){
				$file_o = $ARGV[$i];
			}
		}
	}
}

if($ARGV[0] eq "--help" || $ARGV[0] eq "-h" || !-e $file_i || !$file_i || ($file_i eq $file_o)){
	print <<END

Stuart's template building kit
==============================

Allows HTML templates to be built in modules using SSI include commands.

    -f = the input file
    -l = the column number to sort by

The results are sent to the command line so use you can pipe it into a
file if you wish.

Examples
--------
1. Build a template.html file into a new HTML file:
    perl template.pl template.html 
1. Build a template.html file into a new HTML file and save to output.html:
    perl template.pl template.html output.html

END
}

if(!$file_i){
	print "You need to provide a template file.\n";
	exit;
}
if($file_i eq $file_o){
	print "The template file and output file can't be the same.\n";
	exit;
}
if(!-e $file_i){
	print "$file_i doesn't exist! Quitting.\n";
	exit;
}


%lang = loadLanguage($basedir.$lang."_".$mode.".yaml");
%config = loadConfig($basedir.$lang."_".$mode."_options.json");

$result = parseFile($file_i);

if($file_o){
	$save = 0;
	if(-e $file_o){
		if($overwrite == 1){
			$save = 1;
		}else{
			print "Overwrite $file_o (y/n)? ";
			$a = <STDIN>;
			$a =~ s/[\n\r]//g;
			if($a eq "y" || $a eq "Y"){
				$save = 1;
			}else{
				$save = 0;
			}
		}
	}else{
		$save = 1;
	}
	if($save==1){
		open(FILE,">",$file_o);
		print FILE $result;
		close(FILE);
	}else{
		print "Quitting. Nothing written.\n";
		exit;
	}
}else{
	print "$result";
}


sub parseFile {
	my ($file,$line,@lines,$indent,$html,$dir,$key,@json,$i);
	$html = "";
	$file = $_[0];
	$indent = ($_[1] ? $_[1] : "");

	# Get the base directory for this file - to use for relative paths in any includes
	$dir = "";
	if($file =~ /^(.*\/)[^\/]+/){ $dir = $1; }

	print "Reading $file\n";
	open(FILE,$file);
	@lines = <FILE>;
	close(FILE);

	$str = "";
	foreach $line (@lines){
		$str .= $line;
	}
	$line = $str;

	# Do loops
	$line = parseLoops($line,$config);

	# Do conditional parts
	$line = parseConditional($line);

	while($line =~ /(^|[\n\r])([\t\s]*)\<\!\-\- *\#include *file=\"([^\"]+)\" *\-\-\>/){
		$ind = $indent.$2;
		$inc = $3;
		print "INC=$inc\n";
		$insert = parseFile($dir.$inc,$ind);
		$line =~ s/(^|[\n\r])([\t\s]*)\<\!\-\-\#include file=\"$inc\" \-\-\>/$insert/;
	}
	# Include any JSON files as one line
	while($line =~ /\<\!\-\- *\#include *file=\"([^\"]+\.json)\" *\-\-\>/){
		$inc = $1;
		open(FILE,"$dir$inc");
		@json = <FILE>;
		close(FILE);
		$insert = "";
		for($i = 0; $i < @json; $i++){
			$json[$i] =~ s/[\n\r]//g;
			$json[$i] =~ s/^[\t\s]*//g;
			$json[$i] =~ s/[\t\s]*$//g;
			$json[$i] =~ s/\: *\{/\:\{/g;
			$json[$i] =~ s/\{ *\"/\{\"/g;
			$json[$i] =~ s/ *\}\,/\}\,/g;
			$insert .= "$json[$i]";
		}
		print "INC JSON=$dir$inc\n";
		$line =~ s/\<\!\-\- *\#include *file=\"$inc\" *\-\-\>/$insert/;
	}
	# Update any language variables
	while($line =~ /\<\!--\#echo var=\"([^\"]*)" ?--\>/){
		$key = $1;
		if($lang{$key}){
			$line =~ s/\<\!--\#echo var=\"$key" ?--\>/$lang{$key}/g;
		}else{
			print "ERROR: Can't replace $key ($mode)\n";
			$line =~ s/\<\!--\#echo var=\"$key" ?--\>//g;
		}
	}

	$html .= "$indent$line";

	$html =~ s/%NEWLINE%/\n/g;

	return $html;
}



# Parse conditional SSI using ${LEVEL} = /$mode/
sub parseConditional {

	my($line,$match,$result);
	$line = $_[0];

	# Temporarily zap newlines
	$line =~ s/[\n\r]/%NEWLINE%/g;

	while($line =~ /(\<\!\-\-\#if ((?!\<\!--\#endif).)+((?!\<\!--\#endif).)+\<\!\-\-\#endif\-\-\>)/){
		$match = $1;
		$result = parseIf($match);
		$line =~ s/(\<\!\-\-\#if ((?!\<\!--\#endif).)+((?!\<\!--\#endif).)+\<\!\-\-\#endif\-\-\>)/$result/;
	}

	# Replace newlines
	$line =~ s/%NEWLINE%/\n/g;
	
	return $line;
}

sub parseIf {
	my($exp);
	$exp = $_[0];

	# If none of the if or elif patterns match, we can remove them
	if($exp !~ /expr=\"\$\{LEVEL\} = \/$mode\/"/){
		$exp =~ s/\<\!\-\-\#if expr=\"\$\{LEVEL\} = \/((?!(\<\!--\#else|\<\!--\#endif)).)+//g;
		$exp =~ s/\<\!--\#else\-\-\>//g;
		$exp =~ s/\<\!--\#endif\-\-\>//g;
	}

	# We can now delete all other else
	# Clear away non-matching elif
	$exp =~ s/\<\!\-\-\#else\-\-\>.*//g;
	
	# Check final elif
	$exp =~ s/.*\<\!\-\-\#elif expr=\"\$\{LEVEL\} = \/$mode\/"\-\-\>(((?!\<\!--\#elif).)+)$/$1/;

	# Check middle elif
	$exp =~ s/.*\<\!\-\-\#elif expr=\"\$\{LEVEL\} = \/$mode\/"\-\-\>(((?!\<\!--\#elif).)+).*/$1/;

	# Check for matching if
	$exp =~ s/\<\!\-\-\#if expr=\"\$\{LEVEL\} = \/$mode\/"\-\-\>(((?!\<\!--\#elif).)+).*/$1/g;

	# Clear away rest
	#$exp =~ s/\<!\-\-([^\>]*)\-\->/$1/g;
	return $exp;
}

sub parseLoops {

	my($line,$match,$result,$name,$each,$var,$e,@k,%h,$loop,$tloop,$temp,%this,%conf);
	my ($line,$this) = @_;

	# Temporarily zap newlines
	$line =~ s/[\n\r]/%NEWLINE%/g;

	# Process for loops (these aren't genuine SSI but our own made-up format)
	#	<!--#for each="package" name="iloop" -->
	#		<li>
	#			Title: <!--#json name="dimensions.value" -->  
	#		</li>
	#	<!--#endfor name="iloop" -->
	# Loops over each key (i) in "package". The "json name" gives the JS-style 
	# reference relative to package[i] e.g. package[i].dimensions.value

	while($line =~ /\<\!\-\-\#for( [^\>]*)name="([^\"]*)"([^\>]*) \-\-\>(.*)\<\!\-\-\#endfor name="\2" \-\-\>/){
		$match = $1."name=\"$2\"".$3;
		$loop = $4;
		$match =~ / name="([^\"]*)"/;
		$name = $1;
		$match =~ / each="([^\"]*)"/;
		$each = $1;
		$result = "";

		print "Processing loop $name\n";

		$conf = getConfigHash($each,$this);

		if("%{$conf}" =~ /HASH/){
			$h = $conf;
			foreach $e (sort(keys(%{$h}))){
				if($name eq "loopinner"){
					print "\te = $e\n";
				}
				$tloop = parseLoops($loop,$h->{$e});
				# Get the hash for this time in the loop
				$result .= parseFor($tloop, $e, $h->{$e});
			}
		}elsif("%{$conf}" =~ /ARRAY/){
			@k = @{$conf};
			for($e = 0; $e < @k ; $e++){
				$tloop = $loop;
				# Get the hash for this time in the loop
				$result .= parseFor($tloop, $e, $k[$e]);
			}
		}
		$line =~ s/\<\!\-\-\#for[^\>]*name="$name"[^\>]* \-\-\>.*\<\!\-\-\#endfor name="$name" \-\-\>/$result/;
	}

	# Replace newlines
	$line =~ s/%NEWLINE%/\n/g;
	
	return $line;
}

sub getConfigHash {
	my (@bits,$i,$idx,$key,%var);
	($key, $var) = @_;

	# Split the variable by '.'
	(@bits) = split(/\./,$key);
	for($i = 0; $i < @bits; $i++){
		$idx = -1;
		if($bits[$i] =~ s/\[([0-9]+)\]//){ $idx = $1; }
		$var = $var->{$bits[$i]};
		if($idx >= 0){
			$var = $var->[$idx];
		}
	}
	return $var;
}
sub parseFor {
	my ($exp,$each,$txt,%input,$json,%var,@bits,$i,$idx,$matchvar);
	my ($exp, $e, $input) = @_;
	$txt = $exp;
	
	# Replace this
	$txt =~ s/\<\!\-\-#json name=\"this\" \-\-\>/$e/g;

	while($txt =~ /(\<\!\-\-\#json name=")([^\"]*)(" \-\-\>)/){

		# Get the variable name
		$matchvar = $1.$2.$3;

		%var = getConfigHash($2,$input);
			
		# We need to escape the brackets
		$matchvar =~ s/([\[\]])/\\$1/g;
		$txt =~ s/$matchvar/$var/g
	}
	
	return $txt;
}
