import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  card: {
    width: '100%',
    maxWidth: 400,
    padding: 30,
    border: '2pt solid #0F172A',
    borderRadius: 16,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 10,
    textAlign: 'center'
  },
  subText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 30,
    textAlign: 'center'
  },
  qrContainer: {
    width: 250,
    height: 250,
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10
  },
  qrImage: {
    width: 230,
    height: 230
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 20
  },
  brandText: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: 'bold',
    marginTop: 10
  }
});

interface Props {
  tableId: string;
  qrUrl: string;
}

const TableQrDocument = ({ tableId, qrUrl }: Props) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.card}>
        <Text style={styles.headerText}>Split.It</Text>
        <Text style={styles.subText}>Scan to open your table and split the bill</Text>
        
        <View style={styles.qrContainer}>
          <Image src={qrUrl} style={styles.qrImage} />
        </View>
        
        <Text style={styles.headerText}>Table: {tableId}</Text>
        
        <Text style={styles.footerText}>Powered by</Text>
        <Text style={styles.brandText}>QrBillSplit</Text>
      </View>
    </Page>
  </Document>
);

export default TableQrDocument;
