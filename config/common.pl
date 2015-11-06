sub loadLanguage {
	my ($lang,$line,@lines,$key,$value,%temp);
	$lang = $_[0];
	if(!-e $lang){
		print "ERROR: Can't load $lang.\n";
		return;
	}
	print "Loading $lang\n";
	open(YAML,$lang);
	@lines = <YAML>;
	close(YAML);
	
	foreach $line (@lines){
		$line =~ s/[\n\r]//g;
		if($line !~ /^\-\-\-/ && $line !~ /^\.\.\./){
			$line =~ s/[\s\t]+\#[^\#]*$//;
			($key,$value) = split(/:[\t\s]+/,$line);
			$temp{$key} = $value;
		}
	}
	return %temp;	
}
1;