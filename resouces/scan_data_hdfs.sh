
#kinit bigdata-app-eciborg-asadmin@INTQA.THOMSONREUTERS.COM -k -t bigdata-app-eciborg-asadmin.keytab
# kinit -kt bigdata-app-ecpprodeciborg-asadmin.keytab bigdata-app-ecpprodeciborg-asadmin@ECOM.TLRG.COM 
fname=HDFSLogFileInfoQA_"$(date +%Y%m%d%H)".csv
rm /tmp/scan/"$fname"
hadoop fs -ls -R /project/eciborg/qa > /tmp/scan/"$fname"
chmod a=rw /tmp/scan/"$fname"
echo done
