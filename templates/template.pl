#!/usr/bin/perl
# SSI: http://www.w3.org/Jigsaw/Doc/User/SSI.html


$basedir = "";
if($0 =~ /^(.*\/)[^\/]+/){
	$basedir = $1;
}


#################################
# Process command line arguments
#################################
$overwrite = 0;
for($i = 0; $i < (@ARGV) ; $i++){
	if($ARGV[$i] =~ /^\-+(.*)/){
		$flag = $1;
		if($flag eq "f" || $flag eq "file"){ $file_i = $ARGV[$i+1]; }
		if($flag eq "o" || $flag eq "ofile"){ $file_o = $ARGV[$i+1]; }
		if($flag eq "l" || $flag eq "lang"){ $lang = $ARGV[$i+1]; }
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
	my ($file,$line,@lines,$indent,$html,$dir);
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

	foreach $line (@lines){
		while($line =~ /^([\t\s]*)\<\!\-\- *\#include *file=\"([^\"]+)\" *\-\-\>/){
			$ind = $indent.$1;
			$inc = $2;
			$insert = parseFile($dir.$inc,$ind);
			#print "$insert\n";
			$line =~ s/^([\t\s]*)\<\!\-\-\#include file=\"$inc\" \-\-\>/$insert/;
		}
		# Update any language variables
		#while(<!--#lang var="title" -->){
		#}
		$html .= "$indent$line";
	}
	return $html;
}